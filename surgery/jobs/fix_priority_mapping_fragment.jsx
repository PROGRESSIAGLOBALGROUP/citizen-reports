    // Mapeo correcto: peso (1-5) → prioridad (baja, media, alta)
    // 1=Baja, 2=Normal→media, 3=Media, 4-5=Alta/Crítica→alta
    const prioridad = r.peso >= 4 ? 'alta' : r.peso >= 2 ? 'media' : 'baja';