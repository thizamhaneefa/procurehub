import { prisma } from "./prisma";

// Auto-mark Pending invoices past their due date as Overdue
export async function markOverdueInvoices() {
  await prisma.invoice.updateMany({
    where: { status: "Pending", dueDate: { lt: new Date() } },
    data: { status: "Overdue" },
  });
}
