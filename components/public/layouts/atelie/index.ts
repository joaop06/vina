import { AtelieFooter } from "./AtelieFooter";
import { AtelieHeader } from "./AtelieHeader";
import { AtelieHome } from "./AtelieHome";
import { AtelieNotFound } from "./AtelieNotFound";
import type { SiteLayoutModule } from "../types";

export { AtelieFooter, AtelieHeader, AtelieHome, AtelieNotFound };

export const atelieLayout: SiteLayoutModule = {
  id: "atelie",
  Header: AtelieHeader,
  Footer: AtelieFooter,
  Home: AtelieHome,
  NotFound: AtelieNotFound,
};
