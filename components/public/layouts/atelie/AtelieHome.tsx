import type { HomeProps } from "../contract/types";
import { AtelieHero } from "./hero/AtelieHero";

export function AtelieHome(props: HomeProps) {
  return (
    <main>
      <AtelieHero {...props} />
    </main>
  );
}
