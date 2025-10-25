// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = 'https://lxbjjvfrankabciuizsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4YmpqdmZyYW5rYWJjaXVpenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NjU3NDIsImV4cCI6MjA3NDI0MTc0Mn0.2ZFjxl3LAeCoTd6_Th96ob_CuoFgo-o307VRjg28Qmo';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- LÓGICA DE GESTIÓN DE PACIENTES ---

/**
 * Guarda un nuevo paciente en la base de datos.
 * @param {Object} nuevoPaciente - Objeto con todos los datos del paciente.
 */
async function saveNewPatient(nuevoPaciente) {
    try {
        const { data, error } = await supabaseClient
            .from('paciente')
            .insert([nuevoPaciente])
            .select();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Error: El correo ya existe (duplicado).');
            }
            throw error;
        }

        console.log("Paciente guardado:", data);
        return data;

    } catch (error) {
        console.error("Error al guardar paciente en DB:", error);
        throw error;
    }
}

// --- LÓGICA DE GESTIÓN DE RECETAS ---

/**
 * Carga la lista de pacientes del doctor actual para llenar el <select>.
 */
async function loadPatientsForRecipeSelect() {
    // Usamos localStorage.getItem aquí, ya que currentDoctorId no es global en este script
    const doctorId = localStorage.getItem('doctorId');
    const pacienteSelectUI = document.getElementById('receta-paciente');
    
    if (!doctorId || !pacienteSelectUI) return;

    try {
        const { data: pacientes, error } = await supabaseClient
            .from('paciente')
            .select('id_paciente, nombre_completo')
            .eq('id_doctor', doctorId)
            .order('nombre_completo', { ascending: true });

        if (error) throw error;
        
        // Llama a la función del frontend para rellenar el select
        window.fillPatientSelectUI(pacientes); 

    } catch (error) {
        console.error("Error al cargar pacientes para el select:", error);
        pacienteSelectUI.innerHTML = '<option value="">Error al cargar pacientes</option>';
    }
}

/**
 * Guarda una nueva receta en la base de datos.
 * @param {Object} nuevaReceta - Objeto con los datos de la receta.
 */
async function saveNewRecipe(nuevaReceta) {
    try {
        const { data, error } = await supabaseClient
            .from('recetas') // Asegúrate de que el nombre de la tabla sea correcto
            .insert([nuevaReceta])
            .select();

        if (error) throw error;

        console.log("Receta guardada:", data);
        return data;

    } catch (error) {
        console.error("Error al guardar receta en DB:", error);
        throw error;
    }
}


// --- EXPOSICIÓN GLOBAL DE FUNCIONES ---
window.saveNewPatient = saveNewPatient;
window.loadPatientsForRecipeSelect = loadPatientsForRecipeSelect;
window.saveNewRecipe = saveNewRecipe;