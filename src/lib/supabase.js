import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://qeyuymprpmsqvukmdxfz.supabase.co"
const supabaseKey = "sb_publishable_FonOF_-_Vk-hhCa6JOYD4Q_ZfxxnIdC"

export const supabase = createClient(supabaseUrl, supabaseKey)