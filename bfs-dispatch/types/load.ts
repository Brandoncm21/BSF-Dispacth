import { z } from "zod";
import { LOAD_STATUS, PAID_STATUS } from "@/lib/constants";

export type Load = {
  load_id: number;
  load_number: string | null;
  load_data: string | null;
  weight_lbs: number | null;
  rate: number | null;
  dispatch_fee: number | null;
  load_status: string | null;
  paid_status: string | null;
  factoring: boolean;
  carrier_id: number | null;
  truck_id: number | null;
  driver_id: number | null;
  route_id: number | null;
  cargo_type_id: number | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  carrier_name: string | null;
  driver_name: string | null;
  unit_number: string | null;
  miles: number | null;
  cargo_type_name: string | null;
  total_count?: number;
};

export type LoadForm = {
  load_data: string;
  weight_lbs: string;
  carrier_id: string;
  truck_id: string;
  driver_id: string;
  route_id: string;
  cargo_type_id: string;
  special_requirements_id: string;
  rate: string;
  dispatch_fee_pct: string;
  factoring: boolean;
  load_status: string;
  paid_status: string;
  status_id: number;
  picked_up_at: string;
  delivered_at: string;
};

export type SelectOption = { id: number; label: string };

export const emptyForm: LoadForm = {
  load_data: "",
  weight_lbs: "",
  carrier_id: "",
  truck_id: "",
  driver_id: "",
  route_id: "",
  cargo_type_id: "",
  special_requirements_id: "",
  rate: "",
  dispatch_fee_pct: "",
  factoring: false,
  load_status: LOAD_STATUS.PENDING,
  paid_status: PAID_STATUS.UNPAID,
  status_id: 1,
  picked_up_at: "",
  delivered_at: "",
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const loadSchema = z.object({
  load_data: z.string().optional().or(z.literal("")),
  weight_lbs: z.coerce.number().optional().nullable(),
  carrier_id: z.coerce.number().int().positive("Carrier es requerido"),
  truck_id: z.coerce.number().int().positive("Truck es requerido"),
  driver_id: z.coerce.number().int().positive("Driver es requerido"),
  route_id: z.coerce.number().int().positive("Ruta es requerida"),
  cargo_type_id: z.preprocess((val) => val === "" || val === null ? null : Number(val), z.number().int().positive().nullable().optional()),
  special_requirements_id: z.preprocess((val) => val === "" || val === null ? null : Number(val), z.number().int().positive().nullable().optional()),
  rate: z.coerce.number().min(0, "Rate es requerido"),
  dispatch_fee_pct: z.coerce.number().optional().nullable(),
  factoring: z.boolean().default(false),
  load_status: z.string().default(LOAD_STATUS.PENDING),
  paid_status: z.string().default(PAID_STATUS.UNPAID),
  status_id: z.coerce.number().default(1),
  picked_up_at: z.string().optional().or(z.literal("")),
  delivered_at: z.string().optional().or(z.literal("")),
});

export const documentSchema = z.object({
  rc_file: z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE, "RC debe ser menor a 5MB").optional(),
  bol_file: z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE, "BOL debe ser menor a 5MB").optional(),
}).optional();

export type LoadFormSubmitData = {
  formData: z.infer<typeof loadSchema>;
  rcFile: File | null;
  bolFile: File | null;
};
