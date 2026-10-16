import { useApiRuntime } from "../../../shared/api";
import { LoginButton } from "./LoginButton";
export function RegistrationNotice() {
  const { client } = useApiRuntime();
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Registrations closed</h1>
      <p className="text-sm text-muted-foreground">
        New accounts are currently disabled. Existing users can still log in.
      </p>
      <LoginButton client={client} />
      <a href="/" className="text-sm underline underline-offset-4">
        Back to home
      </a>
    </div>
  );
}
