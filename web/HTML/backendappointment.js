// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://lxbjjvfrankabciuizsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4YmpqdmZyYW5rYWJjaXVpenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NjU3NDIsImV4cCI6MjA3NDI0MTc0Mn0.2ZFjxl3LAeCoTd6_Th96ob_CuoFgo-o307VRjg28Qmo';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Obtiene la referencia a la función de la UI para actualizar la lista. 
// Esto es un puente entre el backend y el frontend.
const mostrarCitasUI = window.mostrarCitas; 
const citasRegistradasContenidoUI = document.getElementById('citas-registradas-contenido');


/**
 * Carga los pacientes asociados a un doctor.
 * @param {string} doctorId - El ID del doctor.
 * @returns {Promise<Array>} Un array de objetos paciente.
 */
async function cargarPacientes(doctorId) {
    if (!doctorId) {
        throw new Error("ID de doctor no proporcionado.");
    }

    try {
        const { data: pacientes, error } = await supabaseClient
            .from('paciente')
            .select('id_paciente, nombre_completo')
            .eq('id_doctor', doctorId)
            .order('nombre_completo');
        
        if (error) throw error;
        
        return pacientes;
    } catch(error) {
        console.error("Error cargando pacientes en backend:", error);
        throw new Error("Fallo al obtener la lista de pacientes.");
    }
}

/**
 * Carga las citas futuras del doctor y llama a la función de UI para mostrarlas.
 * @param {string} doctorId - El ID del doctor.
 */
async function cargarYMostrarCitas(doctorId) {
    if (!doctorId) return;
    
    // Muestra mensaje de carga en la UI (asume el elemento global existe)
    if(citasRegistradasContenidoUI) {
        citasRegistradasContenidoUI.innerHTML = '<p>Buscando citas...</p>';
    }

    const today = new Date();
    // Filtramos por fecha_cita >= hoy
    const todayISO = today.toISOString().split('T')[0]; 

    try {
        const { data: citas, error } = await supabaseClient
            .from('citas')
            .select(`
                id_cita,
                fecha_cita,
                hora_cita,
                paciente:id_paciente ( nombre_completo )
            `)
            .eq('id_doctor', doctorId)
            .gte('fecha_cita', todayISO) 
            .order('fecha_cita', { ascending: true })
            .order('hora_cita', { ascending: true });

        if (error) throw error;
        
        // Llama a la función de presentación de la UI
        if(mostrarCitasUI) {
            mostrarCitasUI(citas); 
        }

    } catch (error) {
        console.error("Error al cargar citas del doctor en backend:", error);
        if(citasRegistradasContenidoUI) {
            citasRegistradasContenidoUI.innerHTML = `<p style="color:red;">Error al cargar citas: ${error.message}</p>`;
        }
    }
}

/**
 * Guarda una nueva cita en Supabase.
 * @param {string} doctorId - ID del doctor.
 * @param {string} pacienteId - ID del paciente.
 * @param {string} fecha - Fecha de la cita (YYYY-MM-DD).
 * @param {string} hora - Hora de la cita (HH:MM).
 */
async function guardarNuevaCita(doctorId, pacienteId, fecha, hora) {
    if (!doctorId || !pacienteId || !fecha || !hora) {
        throw new Error("Datos de cita incompletos.");
    }
    
    const nuevaCita = {
        id_doctor: parseInt(doctorId),
        id_paciente: parseInt(pacienteId),
        fecha_cita: fecha,
        hora_cita: hora + ":00" // Formato necesario para la base de datos (HH:MM:SS)
    };

    try {
        const { data, error } = await supabaseClient
            .from('citas')
            .insert([nuevaCita])
            .select();

        if (error) {
            if (error.code === '23505') { 
                throw new Error(`Ya existe una cita a esta hora para el paciente seleccionado. (${hora})`);
            } else {
                throw error;
            }
        }
        
        // Vuelve a cargar y mostrar la lista de citas en la UI
        cargarYMostrarCitas(doctorId);
        
        return data;

    } catch (error) {
        console.error("Error al guardar cita en backend:", error);
        // Re-lanza el error para que la función de manejo de UI lo capture
        throw error;
    }
}

/**
 * Elimina una cita de Supabase por su ID.
 * @param {string} idCita - El ID de la cita a eliminar.
 */
async function eliminarCita(idCita) {
    if (!idCita) throw new Error("ID de cita no proporcionado.");
    
    try {
        const { error } = await supabaseClient
            .from('citas')
            .delete()
            .eq('id_cita', idCita);

        if (error) throw error;
        
        // Vuelve a cargar y mostrar la lista de citas en la UI
        const currentDoctorId = localStorage.getItem('doctorId');
        if (currentDoctorId) {
            cargarYMostrarCitas(currentDoctorId); 
        }

    } catch (error) {
        console.error("Error al eliminar cita en backend:", error);
        // Re-lanza el error para que la función de manejo de UI lo capture
        throw error;
    }
}

// Expone las funciones principales para que el archivo HTML/UI pueda llamarlas
window.cargarPacientes = cargarPacientes;
window.cargarYMostrarCitas = cargarYMostrarCitas;
window.guardarNuevaCita = guardarNuevaCita;
window.eliminarCita = eliminarCita;