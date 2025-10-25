// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = 'https://lxbjjvfrankabciuizsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4YmpqdmZyYW5rYWJjaXVpenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NjU3NDIsImV4cCI6MjA3NDI0MTc0Mn0.2ZFjxl3LAeCoTd6_Th96ob_CuoFgo-o307VRjg28Qmo';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- PUENTE CON LA UI ---
const pharmacyListContentUI = document.getElementById('pharmacy-list-content');
const displayPharmaciesUI = window.displayPharmaciesUI;


/**
 * Carga las farmacias desde Supabase y las envía a la UI para su visualización.
 */
async function loadAndDisplayPharmacies() {
    if (pharmacyListContentUI) {
        pharmacyListContentUI.innerHTML = '<li class="pharmacy-item">Cargando farmacias...</li>';
    }

    try {
        const { data: farmacias, error } = await supabaseClient
            .from('farmacia')
            .select('id_farmacia, nombre, direccion, telefono, promociones_descuentos')
            .order('nombre', { ascending: true }); 

        if (error) throw error;
        
        // Llama a la función de renderizado de la UI (expuesta en convenios.html)
        if (displayPharmaciesUI) {
            displayPharmaciesUI(farmacias);
        }

    } catch (error) {
        console.error("Error al cargar farmacias en backend:", error);
        if (pharmacyListContentUI) {
            pharmacyListContentUI.innerHTML = `<li class="pharmacy-item" style="color: red;">Error: ${error.message}</li>`;
        }
    }
}

/**
 * Guarda una nueva farmacia en Supabase.
 * @param {string} nombre - Nombre de la farmacia.
 * @param {string} direccion - Dirección.
 * @param {string} telefono - Teléfono.
 * @param {string} promociones - Promociones separadas por coma.
 */
async function saveNewPharmacy(nombre, direccion, telefono, promociones) {
    const newFarmacia = {
        nombre: nombre, 
        direccion: direccion,
        telefono: telefono,
        promociones_descuentos: promociones 
    };

    try {
        const { error } = await supabaseClient
            .from('farmacia')
            .insert([newFarmacia]);

        if (error) throw error;
        
        // Recargar la lista después de la inserción
        await loadAndDisplayPharmacies();

    } catch (error) {
        console.error("Error al guardar farmacia en backend:", error);
        // Relanza el error para que el frontend lo capture y muestre el mensaje
        throw error;
    }
}


// --- EXPOSICIÓN GLOBAL DE FUNCIONES ---
window.loadAndDisplayPharmacies = loadAndDisplayPharmacies;
window.saveNewPharmacy = saveNewPharmacy;