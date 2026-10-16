import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAccount, useDateFormat } from "../../../entities/account";
import { useApiRuntime } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../shared/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../shared/ui/select";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "../../../shared/ui/progress";
import { Skeleton } from "../../../shared/ui/skeleton";
import { createImportHistoryApi } from "../api/api";
import { createImportHistoryQueries } from "../api/queries";
import { ImporterStateType } from "../api/types";
import { validateImportFiles } from "../model/files";

const types = [
  { value: ImporterStateType.privacy, label: "Account data" },
  { value: ImporterStateType.fullPrivacy, label: "Extended streaming history" },
];
const statuses = {
  progress: "Processing",
  success: "Completed",
  failure: "Failed",
  "failure-removed": "Files cleared",
};
function errorMessage(error: unknown) {
  const code = isAxiosError(error) ? error.response?.data?.code : undefined;
  if (code === "ALREADY_IMPORTING") return "An import is already running";
  if (code === "IMPORT_INIT_FAILED")
    return "Could not start import. Check the file type and Spotify connection.";
  return "Request failed. Try again.";
}

export function ImportHistory() {
  const { client, queryClient } = useApiRuntime();
  const account = useAccount(client, queryClient);
  const dateFormat = useDateFormat();
  const enabled = account.data?.status === true;
  const options = createImportHistoryQueries(client).getImports();
  const query = useQuery({ ...options, enabled }, queryClient);
  const api = createImportHistoryApi(client);
  const [type, setType] = useState(ImporterStateType.fullPrivacy);
  const [files, setFiles] = useState<File[]>([]);
  const [validation, setValidation] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: options.queryKey }),
      queryClient.invalidateQueries({
        queryKey: [...client.queryKey, "listening"],
      }),
    ]);
  };
  const upload = useMutation(
    {
      mutationFn: () => api.upload(type, files, setUploadProgress),
      onMutate: () => setUploadProgress(0),
      onSuccess: async () => {
        setUploadProgress(100);
        setFiles([]);
        if (input.current) input.current.value = "";
        await refresh();
      },
      onError: () => setUploadProgress(null),
    },
    queryClient,
  );
  const action = useMutation(
    {
      mutationFn: ({ id, kind }: { id: string; kind: "retry" | "clean" }) =>
        kind === "retry" ? api.retry(id) : api.clean(id),
      onSuccess: refresh,
    },
    queryClient,
  );
  const running =
    query.data?.some((item) => item.status === "progress") ?? false;
  const wasRunning = useRef(false);
  useEffect(() => {
    if (!query.isSuccess) return;
    if (wasRunning.current && !running) {
      void queryClient.invalidateQueries({
        queryKey: [...client.queryKey, "listening"],
      });
    }
    wasRunning.current = running;
  }, [running, query.isSuccess, queryClient, client]);
  const busy = upload.isPending || action.isPending || running;
  if (!enabled) return null;
  return (
    <Card aria-label="Import history">
      <CardHeader>
        <CardTitle>Import history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const error = validateImportFiles(files);
            setValidation(error);
            if (!error) upload.mutate();
          }}
        >
          <div className="space-y-2">
            <label htmlFor="import-type" className="text-sm font-medium">
              Data type
            </label>
            <Select
              items={types}
              value={type}
              onValueChange={(value) => {
                if (value) {
                  setType(value);
                  setUploadProgress(null);
                  upload.reset();
                }
              }}
              disabled={busy}
            >
              <SelectTrigger id="import-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="import-files" className="text-sm font-medium">
              JSON files
            </label>
            <Input
              ref={input}
              id="import-files"
              type="file"
              accept=".json,application/json"
              multiple
              disabled={busy}
              aria-describedby="import-help"
              onChange={(event) => {
                setFiles(Array.from(event.target.files ?? []));
                setUploadProgress(null);
                setValidation(null);
                upload.reset();
              }}
            />
            <p id="import-help" className="text-xs text-muted-foreground">
              Extract your Spotify data ZIP first. Up to 50 JSON files, 20 MB
              each.
            </p>
          </div>
          <Button
            type="submit"
            disabled={busy || query.isPending || query.isError}
          >
            {upload.isPending ? "Uploading…" : "Import files"}
          </Button>
          {(files.length > 0 || uploadProgress !== null) && (
            <Progress value={uploadProgress ?? 0} aria-label="Upload progress">
              <ProgressLabel>
                {upload.isSuccess
                  ? "Upload complete"
                  : upload.isPending
                    ? uploadProgress === 100
                      ? "Starting import…"
                      : "Uploading…"
                    : "Ready to upload"}
              </ProgressLabel>
              <ProgressValue />
            </Progress>
          )}
          {(validation || upload.isError) && (
            <p role="alert" className="text-sm text-destructive">
              {validation ?? errorMessage(upload.error)}
            </p>
          )}
          {upload.isSuccess && (
            <p role="status" className="text-sm text-muted-foreground">
              Import started
            </p>
          )}
          {running && (
            <p role="status" className="text-sm text-muted-foreground">
              An import is running. Status updates automatically.
            </p>
          )}
        </form>
        {query.isPending ? (
          <Skeleton className="h-20 w-full" aria-label="Loading imports" />
        ) : query.isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm">Could not load imports</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </div>
        ) : !query.data?.length ? (
          <p className="text-sm text-muted-foreground">No imports</p>
        ) : (
          <ul className="divide-y">
            {query.data.map((item) => (
              <li
                key={item._id}
                className="space-y-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {types.find((entry) => entry.value === item.type)
                        ?.label ?? item.type}
                    </p>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={item.createdAt}
                    >
                      {dateFormat.format(new Date(item.createdAt))}
                    </time>
                  </div>
                  <p className="text-xs text-muted-foreground" role="status">
                    {statuses[item.status]}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {item.current.toLocaleString("en-US")} /{" "}
                  {item.total.toLocaleString("en-US")}
                </p>
                {item.status === "progress" && (
                  <Progress
                    value={
                      item.total > 0
                        ? Math.min(
                            100,
                            Math.max(0, (item.current / item.total) * 100),
                          )
                        : null
                    }
                    aria-label="Import progress"
                  >
                    <ProgressLabel>
                      {item.total > 0 ? "Processing" : "Preparing…"}
                    </ProgressLabel>
                    {item.total > 0 && <ProgressValue />}
                  </Progress>
                )}
                {item.status === "failure" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        action.mutate({ id: item._id, kind: "retry" })
                      }
                    >
                      Retry import
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        action.mutate({ id: item._id, kind: "clean" })
                      }
                    >
                      Clear files
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {action.isError && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage(action.error)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
