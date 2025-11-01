#!/usr/bin/env python3
"""
CLI para gestión de rollback y testing del Code Surgeon
Comandos de clase mundial para operaciones de rollback y audit trail
"""
from __future__ import annotations
import sys
import argparse
from pathlib import Path
from code_surgeon.surgery.rollback import RollbackManager, ChangeRecord
from code_surgeon.surgery.testing import TestRunner

def cmd_list(args):
    """Lista cambios aplicados con posibilidad de rollback"""
    mgr = RollbackManager(Path("surgery"))
    changes = mgr.list_rollbackable()
    
    if not changes:
        print("✅ No hay cambios registrados")
        return 0
    
    print(f"📋 {len(changes)} cambios aplicados (más reciente primero):\n")
    for i, (timestamp, file, desc) in enumerate(changes, 1):
        print(f"{i}. [{timestamp}] {file}")
        print(f"   {desc}\n")
    
    return 0

def cmd_history(args):
    """Muestra historial detallado de un archivo"""
    mgr = RollbackManager(Path("surgery"))
    file_path = Path(args.file) if args.file else None
    
    history = mgr.get_history(file_path)
    
    if not history:
        msg = f"para {args.file}" if args.file else ""
        print(f"✅ No hay historial {msg}")
        return 0
    
    print(f"📚 Historial de cambios:\n")
    for i, record in enumerate(history, 1):
        print(f"{i}. {record.timestamp}")
        print(f"   Archivo: {record.file_path}")
        print(f"   Modo: {record.mode} [{record.start_marker}...{record.end_marker}]")
        print(f"   Hash: {record.original_hash} → {record.new_hash}")
        if record.post_cmd:
            print(f"   Post-cmd: {record.post_cmd}")
        if record.post_cmd_result:
            status = "✅" if record.post_cmd_result.get("ok") else "❌"
            print(f"   Resultado: {status}")
        print()
    
    return 0

def cmd_rollback(args):
    """Ejecuta rollback del último cambio a un archivo"""
    mgr = RollbackManager(Path("surgery"))
    file_path = Path(args.file)
    
    if not file_path.exists():
        print(f"❌ Archivo no encontrado: {file_path}")
        return 1
    
    # Confirmar si no está en modo force
    if not args.force:
        history = mgr.get_history(file_path)
        if not history:
            print(f"⚠️  No hay historial de cambios para {file_path}")
            return 1
        
        latest = history[0]
        print(f"⚠️  Estás a punto de revertir:")
        print(f"   Archivo: {latest.file_path}")
        print(f"   Timestamp: {latest.timestamp}")
        print(f"   Hash actual: {latest.new_hash} → {latest.original_hash}")
        print()
        
        confirm = input("¿Continuar? [y/N]: ").strip().lower()
        if confirm not in ['y', 'yes', 's', 'si', 'sí']:
            print("❌ Rollback cancelado")
            return 1
    
    success, message = mgr.rollback_last(file_path)
    print(message)
    
    return 0 if success else 1

def cmd_verify(args):
    """Verifica integridad de archivos modificados"""
    mgr = RollbackManager(Path("surgery"))
    issues = mgr.verify_integrity()
    
    if not issues:
        print("✅ Integridad verificada: todos los archivos coinciden con sus registros")
        return 0
    
    print(f"⚠️  Se encontraron {len(issues)} discrepancias:\n")
    for issue in issues:
        print(f"Archivo: {issue['file']}")
        print(f"Problema: {issue['issue']}")
        if issue['issue'] == 'HASH_MISMATCH':
            print(f"  Esperado: {issue['expected']}")
            print(f"  Actual: {issue['actual']}")
        print(f"  Timestamp: {issue['timestamp']}\n")
    
    return 1

def cmd_test(args):
    """Ejecuta tests para un archivo específico"""
    runner = TestRunner(Path.cwd())
    file_path = Path(args.file)
    
    if not file_path.exists():
        print(f"❌ Archivo no encontrado: {file_path}")
        return 1
    
    print(f"🧪 Ejecutando tests para {file_path}...\n")
    
    result = runner.run_tests_for_file(file_path)
    
    print(result.summary())
    if args.verbose:
        print(f"\n{result.output}")
    
    return 0 if result.ok else 1

def cmd_clean(args):
    """Limpia registros antiguos de rollback"""
    import time
    
    mgr = RollbackManager(Path("surgery"))
    days = args.days
    cutoff = time.time() - (days * 86400)
    
    old_files = [
        f for f in mgr.applied_dir.glob("*.json")
        if f.stat().st_mtime < cutoff
    ]
    
    if not old_files:
        print(f"✅ No hay registros más antiguos de {days} días")
        return 0
    
    print(f"⚠️  Se encontraron {len(old_files)} registros antiguos (>{days} días)")
    
    if not args.force:
        confirm = input("¿Eliminar? [y/N]: ").strip().lower()
        if confirm not in ['y', 'yes', 's', 'si', 'sí']:
            print("❌ Operación cancelada")
            return 1
    
    for f in old_files:
        f.unlink()
    
    print(f"✅ {len(old_files)} registros eliminados")
    return 0

def main():
    parser = argparse.ArgumentParser(
        description="Code Surgeon - Gestión de Rollback y Testing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  %(prog)s list                          # Lista cambios aplicados
  %(prog)s history server/app.js         # Historial de un archivo
  %(prog)s rollback server/app.js        # Rollback del último cambio
  %(prog)s verify                        # Verifica integridad
  %(prog)s test server/app.js            # Ejecuta tests para un archivo
  %(prog)s clean --days 30               # Limpia registros >30 días
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Comando a ejecutar')
    
    # list
    subparsers.add_parser('list', help='Lista cambios aplicados')
    
    # history
    parser_history = subparsers.add_parser('history', help='Historial de un archivo')
    parser_history.add_argument('file', nargs='?', help='Archivo a consultar (opcional)')
    
    # rollback
    parser_rollback = subparsers.add_parser('rollback', help='Rollback del último cambio')
    parser_rollback.add_argument('file', help='Archivo a revertir')
    parser_rollback.add_argument('-f', '--force', action='store_true', help='No pedir confirmación')
    
    # verify
    subparsers.add_parser('verify', help='Verifica integridad de archivos')
    
    # test
    parser_test = subparsers.add_parser('test', help='Ejecuta tests para un archivo')
    parser_test.add_argument('file', help='Archivo a testear')
    parser_test.add_argument('-v', '--verbose', action='store_true', help='Muestra output completo')
    
    # clean
    parser_clean = subparsers.add_parser('clean', help='Limpia registros antiguos')
    parser_clean.add_argument('--days', type=int, default=30, help='Días de antigüedad (default: 30)')
    parser_clean.add_argument('-f', '--force', action='store_true', help='No pedir confirmación')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    # Ejecutar comando
    commands = {
        'list': cmd_list,
        'history': cmd_history,
        'rollback': cmd_rollback,
        'verify': cmd_verify,
        'test': cmd_test,
        'clean': cmd_clean
    }
    
    try:
        return commands[args.command](args)
    except Exception as e:
        print(f"❌ Error: {e}")
        if '--verbose' in sys.argv:
            import traceback
            traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())
