import { PlaylistActions } from "../../../features/save-to-playlist";
import { useDateFormat } from "../../../entities/account";
import { ListSkeleton } from "../../../shared/ui/page-skeleton";
import { PeriodFilter } from "../../../features/filter-period";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../shared/ui/accordion";
import { Button } from "../../../shared/ui/button";
import { SessionSongs } from "./SessionSongs";
import { useLongestSessions } from "../model/use-longest-sessions";
import { formatSessionDuration } from "../model/session-format";

export function LongestSessions({ publicToken }: { publicToken?: string }) {
  const dateFormat = useDateFormat(publicToken);
  const { rows, period, setPeriod, message, error, retry, isPending } =
    useLongestSessions(publicToken);
  return (
    <PlaylistActions>
      <div className="space-y-4" aria-busy={isPending}>
        <div className="flex items-center justify-between gap-3">
          <PeriodFilter value={period.value} onChange={setPeriod} />
          <span className="text-xs text-muted-foreground">Top 30</span>
        </div>
        {isPending ? (
          <ListSkeleton />
        ) : message ? (
          <div className="space-y-3 py-12 text-center">
            <p
              role={error ? "alert" : "status"}
              className="text-sm text-muted-foreground"
            >
              {message}
            </p>
            {error && (
              <Button variant="outline" onClick={retry}>
                Retry
              </Button>
            )}
          </div>
        ) : (
          <Accordion
            aria-label="Longest listening sessions"
            key={`${period.value}:${period.end.toISOString()}`}
          >
            {rows.map((session, index) => (
              <AccordionItem key={session.startedAt} value={session.startedAt}>
                <AccordionTrigger className="items-center gap-3 py-4">
                  <span className="w-6 shrink-0 text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span
                      className="block text-base font-semibold tabular-nums"
                      title="Elapsed time, including breaks"
                    >
                      {formatSessionDuration(session.sessionLength)}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      <time dateTime={session.startedAt}>
                        {dateFormat.format(new Date(session.startedAt))}
                      </time>
                      {" – "}
                      <time dateTime={session.endedAt}>
                        {dateFormat.format(new Date(session.endedAt))}
                      </time>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-normal text-muted-foreground">
                    {session.distanceToLast.distance.length.toLocaleString(
                      "en-US",
                    )}{" "}
                    plays
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <SessionSongs
                    session={session}
                    index={index}
                    publicToken={publicToken}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </PlaylistActions>
  );
}
