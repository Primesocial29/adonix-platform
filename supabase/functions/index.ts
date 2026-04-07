import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.20.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    const { userId, userEmail } = await req.json();

    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: userEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // In a real implementation, you would update the user's profile in Supabase here
    // For now, just return the account ID
    return new Response(
      JSON.stringify({ accountId: account.id }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});