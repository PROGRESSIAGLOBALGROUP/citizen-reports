  // Logo PROGRESSIA - Reemplazado por imagen responsiva
  const logoProgressiaStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 'clamp(80px, 15vw, 200px)',
    width: 'clamp(200px, 60vw, 600px)',
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: phase === 'progressia' ? 1 : 0,
    transform: phase === 'progressia' ? 'scale(1)' : 'scale(0.8)'
  };

  const logoImageStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 20px rgba(2, 132, 199, 0.4))'
  };
