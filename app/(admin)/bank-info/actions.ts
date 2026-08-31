"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface UpsertBankInfoInput {
  id?: string;
  bankCode: string;
  accountNo: string;
  accountName: string;
}

export async function upsertBankInfo(input: UpsertBankInfoInput) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("bank_info").upsert({
    id: input.id,
    bank_code: input.bankCode,
    account_no: input.accountNo,
    account_name: input.accountName,
    is_active: true,
  });
  if (error) throw error;

  revalidatePath("/bank-info");
}
