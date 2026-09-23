import { CartHeaderButton } from "@/components/public/cart/CartHeaderButton";
import { AtelieBagIcon } from "./AtelieBagIcon";
import styles from "./atelie-header.module.css";

export function AtelieCartButton({ visible }: { visible: boolean }) {
  return (
    <CartHeaderButton
      visible={visible}
      variant="atelie"
      icon={<AtelieBagIcon />}
      classNames={{
        root: styles.cart,
        link: styles.cartLink,
        badge: styles.cartBadge,
      }}
    />
  );
}
