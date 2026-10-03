export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0 bg-muted/40">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built for external students. Access CrackGov resources anywhere.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CrackGov. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
