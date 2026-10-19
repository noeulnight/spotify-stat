import { useId } from "react";
import {
  FileQuestionIcon,
  HouseIcon,
  RotateCwIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader } from "./card";

const errors = {
  404: {
    title: "Page not found",
    description:
      "This page does not exist or has moved. Check the address or return to your listening activity.",
    Icon: FileQuestionIcon,
  },
  500: {
    title: "Something went wrong",
    description:
      "We could not load this page. Try again in a moment or return to the home page.",
    Icon: TriangleAlertIcon,
  },
};

export function PageError({ code }: { code: keyof typeof errors }) {
  const titleId = useId();
  const { title, description, Icon } = errors[code];
  return (
    <section
      className="flex min-h-[60svh] items-center justify-center"
      aria-labelledby={titleId}
    >
      <Card className="w-full max-w-md text-center">
        <CardHeader className="justify-items-center gap-3 px-6 pt-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon aria-hidden="true" className="size-6" />
          </div>
          <p className="font-mono text-sm text-muted-foreground">{code}</p>
          <h1 id={titleId} className="text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <CardDescription className="text-balance">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-2 px-6 pb-4">
          {code === 500 && (
            <Button onClick={() => window.location.reload()}>
              <RotateCwIcon aria-hidden="true" />
              Try again
            </Button>
          )}
          <Button
            variant={code === 500 ? "outline" : "default"}
            nativeButton={false}
            render={<a href="/" data-astro-reload />}
          >
            <HouseIcon aria-hidden="true" />
            Back to home
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
