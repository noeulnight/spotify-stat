import { useEffect, useId, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { useApiRuntime } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../shared/ui/command";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../shared/ui/card";
import { Input } from "../../../shared/ui/input";
import { Textarea } from "../../../shared/ui/textarea";
import {
  createRecommendationsApi,
  type SpotifySong,
} from "../api/recommendations";
import { createRecommendationQueries } from "../api/queries";
import { spotifyTrackId } from "../model/spotify-track-id";

export function RecommendSongForm({ publicToken }: { publicToken: string }) {
  const fieldId = useId();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SpotifySong | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const { client, queryClient } = useApiRuntime(publicToken);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 250);
    return () => clearTimeout(timer);
  }, [input]);
  const queries = createRecommendationQueries(client);
  const validQuery = input.trim().length >= 1 && input.trim().length <= 100;
  const search = useQuery(
    {
      ...queries.search(query),
      enabled: validQuery && query === input.trim() && !selected,
    },
    queryClient,
  );
  const send = useMutation(
    {
      mutationFn: createRecommendationsApi(client).send,
      onError: (error) => {
        if (isAxiosError(error) && error.response?.status === 409) {
          setSelected((song) => (song ? { ...song, recommended: true } : song));
          void queryClient.invalidateQueries({ queryKey: queries.queryKey });
        }
      },
      onSuccess: () => {
        toast.success("Recommendation sent");
        void queryClient.invalidateQueries({ queryKey: queries.queryKey });
        setInput("");
        setQuery("");
        setSelected(null);
        setName("");
        setMessage("");
      },
    },
    queryClient,
  );
  const status = isAxiosError(send.error)
    ? send.error.response?.status
    : undefined;
  const error =
    status === 409
      ? "Already recommended"
      : status === 429
        ? "Too many requests. Try again later."
        : status === 404
          ? "Share link unavailable"
          : status === 403
            ? "Song recommendations are disabled"
            : send.isError
              ? "Could not send. Try again."
              : null;
  return (
    <Card aria-label="Recommend song" className="min-w-0">
      <CardHeader>
        <CardTitle>Recommend song</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="min-w-0 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (selected && !selected.recommended && !send.isPending)
              send.mutate({
                trackId: selected.id,
                name: name.trim(),
                message: message.trim(),
              });
          }}
        >
          <div className="grid gap-3">
            <span className="text-sm font-medium">Song</span>
            {selected ? (
              <div className="flex min-w-0 items-center gap-3 rounded-lg border p-3">
                {selected.imageUrl && (
                  <img
                    src={selected.imageUrl}
                    alt=""
                    className="size-10 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {selected.title}
                  </p>
                  {selected.artists.length > 0 && (
                    <p className="truncate text-xs text-muted-foreground">
                      {selected.artists.join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Change song"
                  disabled={send.isPending}
                  onClick={() => {
                    setSelected(null);
                    setInput("");
                    send.reset();
                  }}
                >
                  <XIcon />
                </Button>
              </div>
            ) : (
              <Command
                label="Song"
                shouldFilter={false}
                className="h-auto min-w-0 bg-transparent p-0 [&_[data-slot=command-input-wrapper]]:p-0"
              >
                <CommandInput
                  placeholder="Search songs or paste a Spotify link"
                  value={input}
                  maxLength={2048}
                  onValueChange={(value) => {
                    setInput(value);
                    send.reset();
                    const trackId = spotifyTrackId(value);
                    if (trackId)
                      setSelected({
                        id: trackId,
                        title: "Spotify track",
                        artists: [],
                        imageUrl: null,
                        recommended: false,
                      });
                  }}
                />
                <CommandList hidden={!validQuery} className="mt-2 max-h-52">
                  {query !== input.trim() || search.isPending ? (
                    <p
                      role="status"
                      className="p-3 text-sm text-muted-foreground"
                    >
                      Searching…
                    </p>
                  ) : search.isError ? (
                    <p role="alert" className="p-3 text-sm text-destructive">
                      Could not search. Try again.
                    </p>
                  ) : !search.data?.length ? (
                    <p
                      role="status"
                      className="p-3 text-sm text-muted-foreground"
                    >
                      No songs found
                    </p>
                  ) : (
                    search.data.map((track) => (
                      <CommandItem
                        key={track.id}
                        value={track.id}
                        className="cursor-pointer gap-3 py-2"
                        disabled={track.recommended}
                        onSelect={() => setSelected(track)}
                      >
                        {track.imageUrl && (
                          <img
                            src={track.imageUrl}
                            alt=""
                            className="size-10 rounded object-cover"
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {track.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {track.artists.join(", ")}
                          </span>
                        </span>
                        {track.recommended && (
                          <span className="ml-auto text-xs">Recommended</span>
                        )}
                      </CommandItem>
                    ))
                  )}
                </CommandList>
              </Command>
            )}
          </div>
          <div className="grid gap-3">
            <label htmlFor={`${fieldId}-name`} className="text-sm font-medium">
              Name (optional)
            </label>
            <Input
              id={`${fieldId}-name`}
              value={name}
              maxLength={40}
              disabled={send.isPending}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="grid gap-3">
            <label
              htmlFor={`${fieldId}-message`}
              className="text-sm font-medium"
            >
              Message (optional)
            </label>
            <Textarea
              id={`${fieldId}-message`}
              rows={3}
              value={message}
              maxLength={300}
              disabled={send.isPending}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!selected || selected.recommended || send.isPending}
            >
              {send.isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
