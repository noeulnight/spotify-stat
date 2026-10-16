import { useEffect, useState } from "react";
import { useAccount } from "../../../entities/account";
import { useSearch } from "../../../entities/listening";
import { useApiRuntime } from "../../../shared/api";

export function useSearchDialog(publicToken?: string) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const signedIn = account.data?.status === true;
  const search = useSearch(client, query, open && signedIn, queryClient);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 250);
    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !event.repeat &&
        !event.isComposing
      ) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return {
    open,
    setOpen,
    input,
    setInput,
    query,
    account,
    signedIn,
    search,
    pending:
      account.isPending ||
      (signedIn &&
        input.trim().length >= 3 &&
        (input.trim() !== query || search.isPending)),
  };
}
