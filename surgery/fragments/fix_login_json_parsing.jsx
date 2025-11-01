    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      // Verificar si la respuesta es JSON válido antes de parsear
      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('❌ Respuesta no es JSON válido:', jsonError);
        throw new Error('Error de comunicación con el servidor');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      onLoginSuccess(data.usuario);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }