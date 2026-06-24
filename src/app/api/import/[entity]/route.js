export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

const num = (v) => {
  if (v === "" || v == null) return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
};
const int = (v) => { const n = num(v); return n == null ? null : Math.round(n); };
const parseDate = (v) => {
  if (!v && v !== 0) return null;
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 86400 * 1000)); // Excel serial
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/); // dd/mm/yyyy
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

export async function POST(req, { params }) {
  const { rows } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return Response.json({ error: "No rows to import" }, { status: 400 });
  }
  if (rows.length > 2000) {
    return Response.json({ error: "Max 2000 rows per import" }, { status: 400 });
  }

  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true } });
  const supplierByName = Object.fromEntries(suppliers.map((s) => [s.name.toLowerCase().trim(), s.id]));
  const findSupplier = (name) => (name ? supplierByName[String(name).toLowerCase().trim()] ?? null : null);

  let created = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNo = i + 2; // header is row 1
    try {
      switch (params.entity) {
        case "suppliers": {
          if (!r.name) throw new Error("Name is required");
          await prisma.supplier.create({
            data: {
              name: String(r.name),
              contactPerson: String(r.contactPerson || ""),
              email: String(r.email || ""),
              phone: String(r.phone || ""),
              country: String(r.country || ""),
              city: String(r.city || ""),
              category: String(r.category || "General"),
              paymentTerms: String(r.paymentTerms || "Net 30"),
              status: ["Active", "Inactive"].includes(r.status) ? r.status : "Active",
              rating: Math.min(Math.max(int(r.rating) || 3, 1), 5),
            },
          });
          break;
        }
        case "products": {
          if (!r.sku || !r.name) throw new Error("SKU and Name are required");
          const supplierId = findSupplier(r.supplier);
          if (r.supplier && !supplierId) throw new Error(`Supplier "${r.supplier}" not found — import suppliers first`);
          const stockQty = int(r.stockQty) || 0;
          const p = await prisma.product.create({
            data: {
              sku: String(r.sku),
              name: String(r.name),
              category: String(r.category || "General"),
              unit: String(r.unit || "Pcs"),
              supplierId,
              unitCost: num(r.unitCost) || 0,
              lastPurchasePrice: num(r.lastPurchasePrice) ?? (num(r.unitCost) || 0),
              stockQty,
              reorderLevel: int(r.reorderLevel) || 0,
              status: ["Active", "Inactive"].includes(r.status) ? r.status : "Active",
            },
          });
          if (stockQty > 0) {
            await prisma.stockMovement.create({
              data: { productId: p.id, type: "IN", reference: "Opening Stock (import)", quantity: stockQty, balanceAfter: stockQty },
            });
          }
          break;
        }
        case "leads": {
          if (!r.companyName) throw new Error("Company Name is required");
          const stages = ["New", "Contacted", "Quotation Received", "Sample Requested", "Approved", "Rejected"];
          await prisma.lead.create({
            data: {
              companyName: String(r.companyName),
              contact: String(r.contact || ""),
              email: r.email ? String(r.email) : null,
              phone: r.phone ? String(r.phone) : null,
              productOffered: String(r.productOffered || ""),
              quotedPrice: num(r.quotedPrice),
              source: ["Email", "Exhibition", "Referral", "Website"].includes(r.source) ? r.source : "Email",
              status: stages.includes(r.status) ? r.status : "New",
              notes: r.notes ? String(r.notes) : null,
              followUpDate: parseDate(r.followUpDate),
            },
          });
          break;
        }
        case "invoices": {
          if (!r.invoiceNo) throw new Error("Invoice No is required");
          const supplierId = findSupplier(r.supplier);
          if (!supplierId) throw new Error(`Supplier "${r.supplier || ""}" not found — import suppliers first`);
          const invoiceDate = parseDate(r.invoiceDate) || new Date();
          const dueDate = parseDate(r.dueDate) || invoiceDate;
          let poId = null;
          if (r.poNumber) {
            const po = await prisma.purchaseOrder.findUnique({ where: { poNumber: String(r.poNumber).trim() } });
            poId = po?.id ?? null;
          }
          await prisma.invoice.create({
            data: {
              invoiceNo: String(r.invoiceNo),
              supplierId, poId, invoiceDate, dueDate,
              amount: num(r.amount) || 0,
              currency: String(r.currency || "AED").toUpperCase(),
              status: ["Pending", "Approved", "Paid", "Overdue"].includes(r.status) ? r.status : "Pending",
            },
          });
          break;
        }
        default:
          return Response.json({ error: `Unknown import entity "${params.entity}"` }, { status: 400 });
      }
      created++;
    } catch (e) {
      const message = e.code === "P2002" ? "Duplicate (already exists)" : e.message || "Invalid row";
      errors.push({ row: rowNo, message });
    }
  }

  if (created > 0) {
    await prisma.activity.create({
      data: { type: "import", message: `Imported ${created} ${params.entity} from Excel` },
    });
  }
  return Response.json({ created, errors });
}
