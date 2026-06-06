import { useSyncExternalStore } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { limitDialog } from "@/lib/word-usage";

export function LimitReachedDialog() {
  const open = useSyncExternalStore(
    limitDialog.subscribe,
    limitDialog.isOpen,
    () => false,
  );
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && limitDialog.close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Analytics Free Tier Limit Reached</AlertDialogTitle>
          <AlertDialogDescription>
            You have consumed your 100,000 word allowance. Please upgrade to
            Premium for unlimited processing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => limitDialog.close()}>
            Got it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
