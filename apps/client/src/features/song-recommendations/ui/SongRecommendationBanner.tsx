import { Card, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Button } from "../../../shared/ui/button";
import { useApiRuntime } from "../../../shared/api";
import { useAccount } from "../../../entities/account";

export function SongRecommendationBanner({
  publicToken,
}: {
  publicToken: string;
}) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  if (
    !account.data?.status ||
    account.data.user.settings.recommendationsEnabled === false
  )
    return null;
  return (
    <Card aria-label="Recommend song">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>
          <a
            href={`/share/${encodeURIComponent(publicToken)}/recommendations`}
            className="hover:underline"
          >
            Recommend song
          </a>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <a
              href={`/share/${encodeURIComponent(publicToken)}/recommendations`}
            />
          }
        >
          Recommend
        </Button>
      </CardHeader>
    </Card>
  );
}
