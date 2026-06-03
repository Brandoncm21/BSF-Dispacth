"use server";

import { getSupabaseServerClient } from "./core";

export type LoadDocument = {
  document_id: number;
  load_id: number;
  document_type: "RC" | "BOL" | "POD";
  file_path: string;
  file_name: string;
  file_size: number | null;
  uploaded_at: string | null;
  uploaded_by: number | null;
};

export async function uploadLoadDocument(
  loadId: number,
  documentType: "RC" | "BOL" | "POD",
  file: File,
  uploadedBy: number | null
) {
  const supabase = await getSupabaseServerClient();

  const timestamp = Date.now();
  const fileName = `${documentType}_${timestamp}.pdf`;
  const filePath = `loads/${loadId}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("load_documents")
    .upload(filePath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Error uploading file: ${uploadError.message}`);
  }

  const { data: docData, error: docError } = await supabase
    .from("load_documents")
    .insert({
      load_id: loadId,
      document_type: documentType,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: uploadedBy,
    })
    .select("document_id")
    .single();

  if (docError) {
    await supabase.storage.from("load_documents").remove([filePath]);
    throw new Error(`Error saving document record: ${docError.message}`);
  }

  return docData.document_id;
}

export async function getLoadDocuments(loadId: number) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("load_documents")
    .select("*")
    .eq("load_id", loadId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  return data as LoadDocument[];
}

export async function getDocumentSignedUrl(filePath: string) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.storage
    .from("load_documents")
    .createSignedUrl(filePath, 3600);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteLoadDocument(documentId: number, filePath: string) {
  const supabase = await getSupabaseServerClient();

  const { error: storageError } = await supabase.storage
    .from("load_documents")
    .remove([filePath]);

  if (storageError) {
    throw new Error(`Error eliminando archivo de storage: ${storageError.message}`);
  }

  const { error: dbError } = await supabase
    .from("load_documents")
    .delete()
    .eq("document_id", documentId);

  if (dbError) throw dbError;
}
