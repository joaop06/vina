"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CartIcon } from "@/components/public/icons/StorefrontIcons";
import { useCartOptional } from "@/components/public/cart/CartProvider";
import type { SiteLayoutId } from "@/src/schemas/site-config";

type ClassNames = {
  root?: string;
  link?: string;
  badge?: string;
};

export function CartHeaderButton({
  visible,
  variant,
  classNames = {},
  icon,
}: {
  visible: boolean;
  variant: SiteLayoutId;
  classNames?: ClassNames;
  /** Replaces the shared cart glyph. Other layouts keep the default icon. */
  icon?: ReactNode;
}) {
  const cart = useCartOptional();
  if (!visible || !cart?.enabled) return null;

  const count = cart.unitCount;
  const label =
    count > 0 ? `Carrinho, ${count} ${count === 1 ? "item" : "itens"}` : "Carrinho";

  return (
    <div
      className={classNames.root ?? "header-cart"}
      data-variant={variant}
    >
      <Link
        href="/carrinho"
        className={classNames.link ?? "header-cart__link"}
        aria-label={label}
      >
        {icon ?? <CartIcon />}
        {count > 0 ? (
          <span className={classNames.badge ?? "header-cart__badge"}>
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
