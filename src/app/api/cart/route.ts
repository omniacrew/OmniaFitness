import { NextRequest, NextResponse } from "next/server";
import {
  CART_COOKIE,
  addLine,
  createCart,
  getCart,
  updateLine,
  type Cart,
} from "@/lib/shopify-cart";

export const dynamic = "force-dynamic";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days, roughly Shopify's cart lifetime

function respond(cart: Cart | null, status = 200) {
  const res = NextResponse.json({ cart }, { status });
  if (cart) {
    res.cookies.set(CART_COOKIE, cart.id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  } else {
    res.cookies.delete(CART_COOKIE);
  }
  return res;
}

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function currentCart(req: NextRequest) {
  const id = req.cookies.get(CART_COOKIE)?.value;
  if (!id) return null;
  try {
    return await getCart(id);
  } catch {
    return null;
  }
}

/** GET /api/cart → the visitor's cart (or null). */
export async function GET(req: NextRequest) {
  return respond(await currentCart(req));
}

/** POST /api/cart { merchandiseId, quantity } → add an item. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const merchandiseId = body?.merchandiseId;
  const quantity = Math.max(1, Math.min(20, Number(body?.quantity) || 1));
  if (typeof merchandiseId !== "string" || !merchandiseId.startsWith("gid://shopify/ProductVariant/")) {
    return error("Missing product variant");
  }
  try {
    const existing = await currentCart(req);
    const cart = existing
      ? await addLine(existing.id, merchandiseId, quantity)
      : await createCart(merchandiseId, quantity);
    return respond(cart);
  } catch (e) {
    console.error("[cart] add failed", e);
    return error("Couldn't add that to your cart. Please try again.", 502);
  }
}

/** PATCH /api/cart { lineId, quantity } → change quantity (0 removes). */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const lineId = body?.lineId;
  const quantity = Math.max(0, Math.min(20, Number(body?.quantity)));
  if (typeof lineId !== "string" || Number.isNaN(quantity)) {
    return error("Missing cart line");
  }
  const existing = await currentCart(req);
  if (!existing) return error("Your cart has expired. Please add the item again.", 404);
  try {
    return respond(await updateLine(existing.id, lineId, quantity));
  } catch (e) {
    console.error("[cart] update failed", e);
    return error("Couldn't update your cart. Please try again.", 502);
  }
}
