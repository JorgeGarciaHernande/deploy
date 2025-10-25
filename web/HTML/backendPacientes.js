// --- CONFIG SUPABASE ---
const SUPABASE_URL = 'https://lxbjjvfrankabciuizsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4YmpqdmZyYW5rYWJjaXVpenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NjU3NDIsImV4cCI6MjA3NDI0MTc0Mn0.2ZFjxl3LAeCoTd6_Th96ob_CuoFgo-o307VRjg28Qmo';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- PUENTES CON LA UI (solo funciones, no elementos DOM) ---
const mostrarPacientesUI = window.mostrarPacientesUI;
const mostrarErrorListaUI = window.mostrarErrorListaUI;
const llenarPerfilModalUI = window.llenarPerfilModalUI;
const limpiarYMostrarCargaModalUI = window.limpiarYMostrarCargaModal;

// Funciones auxiliares traídas del HTML para el modal
const calcularEdadUI = window.calcularEdad;
const getEstadoGlucosaDetalladoUI = window.getEstadoGlucosaDetallado;
const formatearFechaSimpleUI = window.formatearFechaSimple;

// ------------------------------------------------------------------
// --- LÓGICA DE NEGOCIO Y ACCESO A DATOS (BACKEND) ---
// ------------------------------------------------------------------

/**
 * Inicia la carga de las listas de pacientes (activos e inactivos).
 * Lee los elementos DOM de la ventana para asegurar que estén cargados.
 * @param {string} doctorId - El ID del doctor actual.
 */
async function iniciarCargaDePacientes(doctorId) {
    if (!doctorId) return;
    
    // LEER LOS ELEMENTOS DOM AQUÍ, DESPUÉS DE QUE EL HTML LOS EXPUSE
    const pacientesContainerUI = window.pacientesContainer;
    const inactivosContainerUI = window.inactivosContainer;
    const loadingElementUI = window.loadingElement;
    const loadingInactivosUI = window.loadingInactivos;

    // Verificar que los contenedores existen antes de intentar usarlos
    if (!pacientesContainerUI || !inactivosContainerUI) {
        console.error("Error: Elementos DOM de contenedores no encontrados.");
        return;
    }

    // Muestra el loader antes de la carga
    if (loadingElementUI) loadingElementUI.style.display = 'block';
    if (loadingInactivosUI) loadingInactivosUI.style.display = 'block';

    // Cargar ambas listas simultáneamente
    await Promise.all([
        // PASAMOS EL DOCTORID Y EL CONTENEDOR CORRECTO
        cargarPacientes(pacientesContainerUI, false, doctorId), 
        cargarPacientes(inactivosContainerUI, true, doctorId)  
    ]).catch(err => {
        console.error("Fallo al cargar una o ambas listas de pacientes:", err);
    });
}


/**
 * Carga los pacientes del doctor para la lista activa o inactiva.
 * @param {HTMLElement} containerElement - El contenedor DOM.
 * @param {boolean} loadInactive - Si se deben cargar pacientes inactivos.
 * @param {string} doctorId - ID del doctor.
 */
async function cargarPacientes(containerElement, loadInactive = false, doctorId) {
    // Si el elemento es undefined, salimos inmediatamente para evitar el TypeError.
    if (!containerElement || !doctorId) return; 

    try {
        let query = supabaseClient
            .from('paciente')
            .select('id_paciente, nombre_completo, correo, ultima_medida_glucosa, activo')
            .eq('id_doctor', doctorId);

        // FILTRO: Activo (FALSE) o No Activo (Activo o NULL)
        if (loadInactive) {
            query = query.eq('activo', false); 
        } else {
            query = query.not('activo', 'eq', false); 
        }

        const { data: pacientes, error } = await query
            .order('nombre_completo', { ascending: true });

        if (error) { throw error; }
        
        // Llama a la función de la UI para renderizar los resultados
        mostrarPacientesUI(pacientes, containerElement, loadInactive);

    } catch (error) {
        console.error(`Error al cargar la lista ${loadInactive ? 'inactiva' : 'activa'} de pacientes:`, error);
        mostrarErrorListaUI(`Error al cargar pacientes: ${error.message}`, loadInactive);
    }
}

/**
 * Actualiza el estado activo/inactivo de un paciente en la base de datos.
 */
async function cambiarEstadoPaciente(pacienteId, esActivoActual) {
    const nuevoEstado = !esActivoActual; 
    const doctorId = localStorage.getItem('doctorId');

    try {
        const { error } = await supabaseClient
            .from('paciente')
            .update({ activo: nuevoEstado })
            .eq('id_paciente', pacienteId);

        if (error) { throw error; }

        // Recargar ambas listas después de la actualización exitosa
        await iniciarCargaDePacientes(doctorId); 

    } catch (error) {
        console.error('Error al cambiar estado del paciente en DB:', error);
        throw new Error(`Fallo en la base de datos al cambiar el estado: ${error.message}`);
    }
}

/**
 * Muestra el modal de perfil de un paciente y carga sus datos completos.
 */
async function mostrarPerfilModal(pacienteId) { 
    const profileModalUI = window.profileModal;
    if (!profileModalUI) return;
    
    // Usamos las funciones del HTML para manejar la UI
    limpiarYMostrarCargaModalUI(true);
    profileModalUI.showModal();
    
    const currentDoctorId = localStorage.getItem('doctorId');

    try {
        const { data: paciente, error } = await supabaseClient
            .from('paciente')
            .select('nombre_completo, fecha_nacimiento, correo, ultima_medida_glucosa, altura, peso, id_doctor, activo')
            .eq('id_paciente', pacienteId)
            .single();

        if (error) { throw error; }

        if (!paciente || paciente.id_doctor != currentDoctorId) {
            throw new Error("Paciente no encontrado o acceso no autorizado.");
        }
        
        // Llama a la función de la UI para rellenar el modal con los datos
        llenarPerfilModalUI(paciente);

    } catch (error) {
        console.error("Error al cargar perfil en modal:", error);
        // Manejo de error en la UI
        profileModalUI.querySelector('#profile-nombre').textContent = 'Error al Cargar';
        const errorP = document.createElement('p');
        errorP.textContent = `Error: ${error.message}`;
        errorP.style.color = 'red';
        errorP.id = 'modal-load-error';
        const modalContent = profileModalUI.querySelector('.profile-modal-content');
        if(modalContent) modalContent.appendChild(errorP);
    }
}


// ------------------------------------------------------------------
// --- EXPOSICIÓN GLOBAL (Para que mis_pacientes.html pueda llamarlas) ---
// ------------------------------------------------------------------
window.iniciarCargaDePacientes = iniciarCargaDePacientes;
window.cambiarEstadoPaciente = cambiarEstadoPaciente;
window.mostrarPerfilModal = mostrarPerfilModal;