import "./atelie.css";
import { AtelieFooter } from "./AtelieFooter";
import { AtelieHeader } from "./AtelieHeader";
import { AtelieHome } from "./AtelieHome";
import { AtelieNotFound } from "./AtelieNotFound";
import { AteliePreview } from "./AteliePreview";
import type { SiteLayoutModule } from "../contract/types";

export { AtelieFooter, AtelieHeader, AtelieHome, AtelieNotFound };

export const atelieLayout: SiteLayoutModule = {
  id: "atelie",
  Header: AtelieHeader,
  Footer: AtelieFooter,
  Home: AtelieHome,
  NotFound: AtelieNotFound,
  Preview: AteliePreview,
};
