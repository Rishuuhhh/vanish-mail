import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { App } from "@/components/temp-mail-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "vanish.mail — disposable inboxes with instant OTP" },
      { name: "description", content: "Generate a working throwaway email address in one click. Receive messages, grab the verification code, vanish. No signup." },
      { property: "og:title", content: "vanish.mail — disposable inboxes" },
      { property: "og:description", content: "One-click temp email with auto OTP detection." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <App />
      <Toaster theme="dark" position="bottom-right" />
    </>
  );
}
