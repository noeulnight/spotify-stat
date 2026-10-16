import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { Resizable } from "re-resizable";
import { SidebarInset } from "../../../shared/ui/sidebar";

export function ResizablePlaybackPanel({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(320);
  const [resizing, setResizing] = useState(false);
  const [maxWidth, setMaxWidth] = useState(() =>
    typeof window === "undefined" ? 560 : Math.floor(window.innerWidth / 2),
  );
  const panelWidth = Math.min(width, maxWidth);

  useEffect(() => {
    const resize = () => setMaxWidth(Math.floor(window.innerWidth / 2));
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <Collapsible.Panel
      style={
        { "--playback-panel-width": `${panelWidth + 8}px` } as CSSProperties
      }
      className={`min-h-0 w-(--playback-panel-width) max-w-[calc(50vw+0.5rem)] shrink-0 overflow-hidden opacity-100 transition-[width,opacity] duration-250 ease-in-out data-ending-style:w-0 data-ending-style:opacity-0 data-starting-style:w-0 data-starting-style:opacity-0 motion-reduce:transition-none ${resizing ? "transition-none" : ""}`}
    >
      <Resizable
        size={{ width: panelWidth, height: "100%" }}
        minWidth={240}
        maxWidth={maxWidth}
        enable={{ left: true }}
        onResizeStart={() => setResizing(true)}
        onResize={(_event, _direction, element) =>
          setWidth(element.offsetWidth)
        }
        onResizeStop={() => setResizing(false)}
        handleStyles={{ left: { left: 0, width: 8 } }}
        handleComponent={{
          left: (
            <div
              role="separator"
              aria-label="Resize now playing"
              aria-orientation="vertical"
              aria-valuemin={240}
              aria-valuemax={maxWidth}
              aria-valuenow={panelWidth}
              tabIndex={0}
              className="relative h-full w-full cursor-col-resize touch-none outline-none after:absolute after:top-1/2 after:left-1/2 after:h-8 after:w-1 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-border after:opacity-0 after:transition-opacity hover:after:opacity-100 focus-visible:after:bg-ring focus-visible:after:opacity-100 motion-reduce:after:transition-none"
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 240
                    : event.key === "End"
                      ? maxWidth
                      : panelWidth + (event.key === "ArrowLeft" ? 20 : -20);
                setWidth(Math.max(240, Math.min(maxWidth, next)));
              }}
            />
          ),
        }}
      >
        <SidebarInset
          id="lyrics-panel"
          role="complementary"
          aria-label="Now playing"
          className="m-2 ml-0 h-[calc(100%-1rem)] min-h-0 w-full flex-none overflow-hidden rounded-xl shadow-sm"
        >
          {children}
        </SidebarInset>
      </Resizable>
    </Collapsible.Panel>
  );
}
