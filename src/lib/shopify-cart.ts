// Server-only cart helpers (Shopify Storefront Cart API). The browser never
// talks to Shopify directly: it calls /api/cart, which keeps the cart id in
// an httpOnly cookie and uses these functions.

import { formatPrice, storefront } from "@/lib/shopify";

export const CART_COOKIE = "omnia_cart";

export type CartLine = {
  id: string;
  quantity: number;
  merchandiseId: string;
  productTitle: string;
  productHandle: string;
  variantTitle: string | null; // null for single-variant products
  image: string | null;
  unitPrice: string;
  lineTotal: string;
  availableForSale: boolean;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: string;
  lines: CartLine[];
};

const CART_FIELDS = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { subtotalAmount { amount currencyCode } }
    lines(first: 50) {
      nodes {
        id
        quantity
        cost {
          amountPerQuantity { amount currencyCode }
          totalAmount { amount currencyCode }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            image { url }
            product { title handle featuredImage { url } }
          }
        }
      }
    }
  }
`;

type Money = { amount: string; currencyCode: string };
type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      cost: { amountPerQuantity: Money; totalAmount: Money };
      merchandise: {
        id: string;
        title: string;
        availableForSale: boolean;
        image: { url: string } | null;
        product: { title: string; handle: string; featuredImage: { url: string } | null };
      };
    }[];
  };
};

type UserError = { field: string[] | null; message: string };

function normalize(c: RawCart): Cart {
  return {
    id: c.id,
    checkoutUrl: c.checkoutUrl,
    totalQuantity: c.totalQuantity,
    subtotal: formatPrice(c.cost.subtotalAmount.amount, c.cost.subtotalAmount.currencyCode),
    lines: c.lines.nodes.map((l) => ({
      id: l.id,
      quantity: l.quantity,
      merchandiseId: l.merchandise.id,
      productTitle: l.merchandise.product.title,
      productHandle: l.merchandise.product.handle,
      variantTitle:
        l.merchandise.title === "Default Title" ? null : l.merchandise.title,
      image: l.merchandise.image?.url ?? l.merchandise.product.featuredImage?.url ?? null,
      unitPrice: formatPrice(
        l.cost.amountPerQuantity.amount,
        l.cost.amountPerQuantity.currencyCode
      ),
      lineTotal: formatPrice(l.cost.totalAmount.amount, l.cost.totalAmount.currencyCode),
      availableForSale: l.merchandise.availableForSale,
    })),
  };
}

function check(errors: UserError[] | undefined) {
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await storefront<{ cart: RawCart | null }>(
    `${CART_FIELDS} query GetCart($id: ID!) { cart(id: $id) { ...CartFields } }`,
    { variables: { id: cartId }, revalidate: false }
  );
  return data.cart ? normalize(data.cart) : null;
}

export async function createCart(merchandiseId: string, quantity: number): Promise<Cart> {
  const data = await storefront<{
    cartCreate: { cart: RawCart | null; userErrors: UserError[] };
  }>(
    `${CART_FIELDS}
    mutation CreateCart($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }`,
    { variables: { lines: [{ merchandiseId, quantity }] }, revalidate: false }
  );
  check(data.cartCreate.userErrors);
  return normalize(data.cartCreate.cart!);
}

export async function addLine(
  cartId: string,
  merchandiseId: string,
  quantity: number
): Promise<Cart> {
  const data = await storefront<{
    cartLinesAdd: { cart: RawCart | null; userErrors: UserError[] };
  }>(
    `${CART_FIELDS}
    mutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }`,
    { variables: { cartId, lines: [{ merchandiseId, quantity }] }, revalidate: false }
  );
  check(data.cartLinesAdd.userErrors);
  return normalize(data.cartLinesAdd.cart!);
}

/** Sets a line's quantity; 0 removes it. */
export async function updateLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<Cart> {
  if (quantity <= 0) {
    const data = await storefront<{
      cartLinesRemove: { cart: RawCart | null; userErrors: UserError[] };
    }>(
      `${CART_FIELDS}
      mutation RemoveLines($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }`,
      { variables: { cartId, lineIds: [lineId] }, revalidate: false }
    );
    check(data.cartLinesRemove.userErrors);
    return normalize(data.cartLinesRemove.cart!);
  }
  const data = await storefront<{
    cartLinesUpdate: { cart: RawCart | null; userErrors: UserError[] };
  }>(
    `${CART_FIELDS}
    mutation UpdateLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }`,
    { variables: { cartId, lines: [{ id: lineId, quantity }] }, revalidate: false }
  );
  check(data.cartLinesUpdate.userErrors);
  return normalize(data.cartLinesUpdate.cart!);
}
