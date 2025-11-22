#!/usr/bin/env python3
"""
Database Analysis & Consolidation Script
Escanea recursivamente todas las bases de datos SQLite en el proyecto,
compara esquemas, y consolida en una BD maestra.
"""

import os
import sys
import sqlite3
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

class DatabaseAnalyzer:
    def __init__(self, root_path):
        self.root_path = Path(root_path)
        self.databases = []
        self.analysis = {}
        
    def find_all_databases(self):
        """Encuentra todas las bases de datos SQLite recursivamente"""
        print(f"🔍 Escaneando desde: {self.root_path}")
        
        # Extensiones comunes de SQLite
        extensions = ['.db', '.sqlite', '.sqlite3', '.db3']
        
        for ext in extensions:
            for db_file in self.root_path.rglob(f'*{ext}'):
                # Excluir node_modules, dist, y otros directorios irrelevantes
                if any(excluded in str(db_file) for excluded in ['node_modules', 'dist', '.git', 'playwright-report']):
                    continue
                    
                # Verificar que sea un archivo SQLite válido
                if self.is_valid_sqlite_db(db_file):
                    self.databases.append(db_file)
                    print(f"  ✅ Encontrada: {db_file.relative_to(self.root_path)}")
        
        print(f"\n📊 Total de bases de datos encontradas: {len(self.databases)}")
        return self.databases
    
    def is_valid_sqlite_db(self, file_path):
        """Verifica si un archivo es una BD SQLite válida"""
        try:
            with open(file_path, 'rb') as f:
                header = f.read(16)
                return header[:15] == b'SQLite format 3'
        except Exception:
            return False
    
    def analyze_database(self, db_path):
        """Analiza el esquema y contenido de una base de datos"""
        print(f"\n🔬 Analizando: {db_path.relative_to(self.root_path)}")
        
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Obtener todas las tablas
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            tables = [row[0] for row in cursor.fetchall()]
            
            analysis = {
                'path': str(db_path),
                'relative_path': str(db_path.relative_to(self.root_path)),
                'size_bytes': db_path.stat().st_size,
                'size_kb': round(db_path.stat().st_size / 1024, 2),
                'modified': datetime.fromtimestamp(db_path.stat().st_mtime).isoformat(),
                'tables': {},
                'total_tables': len(tables),
                'total_rows': 0
            }
            
            # Analizar cada tabla
            for table in tables:
                # Obtener esquema
                cursor.execute(f"PRAGMA table_info({table})")
                columns = cursor.fetchall()
                
                # Obtener índices
                cursor.execute(f"PRAGMA index_list({table})")
                indexes = cursor.fetchall()
                
                # Contar registros
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                row_count = cursor.fetchone()[0]
                
                analysis['tables'][table] = {
                    'columns': [
                        {
                            'id': col[0],
                            'name': col[1],
                            'type': col[2],
                            'not_null': bool(col[3]),
                            'default': col[4],
                            'primary_key': bool(col[5])
                        }
                        for col in columns
                    ],
                    'column_count': len(columns),
                    'index_count': len(indexes),
                    'row_count': row_count
                }
                
                analysis['total_rows'] += row_count
                
                print(f"  📋 {table}: {len(columns)} columnas, {row_count} registros")
            
            conn.close()
            
            return analysis
            
        except Exception as e:
            print(f"  ❌ Error analizando {db_path}: {e}")
            return None
    
    def compare_schemas(self):
        """Compara esquemas entre todas las bases de datos"""
        print("\n🔄 Comparando esquemas...")
        
        # Agrupar por tablas comunes
        table_occurrences = defaultdict(list)
        
        for db_path, analysis in self.analysis.items():
            for table_name in analysis['tables'].keys():
                table_occurrences[table_name].append(db_path)
        
        print("\n📊 Tablas encontradas:")
        for table, dbs in sorted(table_occurrences.items()):
            print(f"  • {table}: en {len(dbs)} BD(s)")
        
        return table_occurrences
    
    def find_master_database(self):
        """Identifica la base de datos más completa y actualizada"""
        print("\n🎯 Identificando base de datos maestra...")
        
        if not self.analysis:
            print("❌ No hay bases de datos analizadas")
            return None
        
        # Criterios de evaluación (peso)
        scores = {}
        
        for db_path, analysis in self.analysis.items():
            score = 0
            
            # 1. Número de tablas (30%)
            score += analysis['total_tables'] * 10
            
            # 2. Número total de columnas (20%)
            total_columns = sum(t['column_count'] for t in analysis['tables'].values())
            score += total_columns * 5
            
            # 3. Fecha de modificación más reciente (15%)
            mod_time = datetime.fromisoformat(analysis['modified'])
            days_old = (datetime.now() - mod_time).days
            score += max(0, 100 - days_old)
            
            # 4. Tamaño (indica contenido) (15%)
            score += min(analysis['size_kb'] / 10, 50)
            
            # 5. Presencia de tablas críticas (20%)
            critical_tables = ['reportes', 'usuarios', 'tipos_reporte', 'categorias', 'dependencias']
            has_critical = sum(1 for t in critical_tables if t in analysis['tables'])
            score += has_critical * 20
            
            scores[db_path] = score
            
            print(f"  📊 {Path(db_path).relative_to(self.root_path)}: {score:.1f} pts")
        
        # Encontrar la mejor
        master_db = max(scores, key=scores.get)
        print(f"\n🏆 Base de datos maestra: {Path(master_db).relative_to(self.root_path)}")
        print(f"   Score: {scores[master_db]:.1f} pts")
        
        return master_db
    
    def consolidate_schemas(self, master_db_path):
        """Consolida esquemas faltantes en la BD maestra"""
        print(f"\n🔧 Consolidando esquemas...")
        
        master_analysis = self.analysis[master_db_path]
        master_tables = set(master_analysis['tables'].keys())
        
        missing_tables = {}
        
        # Buscar tablas que existen en otras BDs pero no en la maestra
        for db_path, analysis in self.analysis.items():
            if db_path == master_db_path:
                continue
            
            for table_name, table_info in analysis['tables'].items():
                if table_name not in master_tables:
                    if table_name not in missing_tables:
                        missing_tables[table_name] = {
                            'source_db': db_path,
                            'info': table_info
                        }
        
        if missing_tables:
            print(f"  ⚠️ Tablas faltantes en la maestra: {len(missing_tables)}")
            for table_name, info in missing_tables.items():
                print(f"    • {table_name} (en {Path(info['source_db']).name})")
        else:
            print("  ✅ La base de datos maestra contiene todas las tablas")
        
        # Comparar columnas en tablas existentes
        column_differences = {}
        
        for db_path, analysis in self.analysis.items():
            if db_path == master_db_path:
                continue
            
            for table_name in master_tables:
                if table_name in analysis['tables']:
                    master_cols = {col['name']: col for col in master_analysis['tables'][table_name]['columns']}
                    other_cols = {col['name']: col for col in analysis['tables'][table_name]['columns']}
                    
                    missing_cols = set(other_cols.keys()) - set(master_cols.keys())
                    if missing_cols:
                        if table_name not in column_differences:
                            column_differences[table_name] = []
                        column_differences[table_name].extend([(db_path, col) for col in missing_cols])
        
        if column_differences:
            print(f"\n  ⚠️ Columnas faltantes en tablas de la maestra:")
            for table_name, diffs in column_differences.items():
                print(f"    • {table_name}:")
                for db_path, col_name in diffs:
                    print(f"      - {col_name} (en {Path(db_path).name})")
        else:
            print("  ✅ Todas las tablas tienen las columnas completas")
        
        return {
            'missing_tables': missing_tables,
            'column_differences': column_differences
        }
    
    def generate_report(self, output_file='database-analysis-report.json'):
        """Genera reporte detallado en JSON"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_databases': len(self.databases),
            'databases': self.analysis,
            'master_database': None
        }
        
        if self.analysis:
            master_db = self.find_master_database()
            report['master_database'] = str(Path(master_db).relative_to(self.root_path))
            report['consolidation'] = self.consolidate_schemas(master_db)
        
        output_path = self.root_path / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Reporte guardado: {output_path}")
        return output_path
    
    def move_to_garbage(self, master_db_path):
        """Mueve bases de datos obsoletas a carpeta Garbage"""
        garbage_dir = self.root_path / 'Garbage' / 'databases' / datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        garbage_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"\n🗑️ Moviendo bases de datos obsoletas a: {garbage_dir.relative_to(self.root_path)}")
        
        moved = []
        for db_path_str in self.analysis.keys():
            db_path = Path(db_path_str)
            if db_path_str != master_db_path:
                # Preservar estructura de directorios relativa
                rel_path = db_path.relative_to(self.root_path)
                dest_path = garbage_dir / rel_path
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Mover archivo
                import shutil
                shutil.move(str(db_path), str(dest_path))
                moved.append((db_path, dest_path))
                print(f"  📦 {rel_path} → Garbage")
        
        print(f"\n✅ {len(moved)} bases de datos movidas a Garbage (histórico)")
        return moved

def main():
    root_path = Path(__file__).parent.parent  # Carpeta raíz del proyecto
    
    print("="*70)
    print("🔍 DATABASE ANALYZER & CONSOLIDATOR")
    print("="*70)
    
    analyzer = DatabaseAnalyzer(root_path)
    
    # Paso 1: Escanear
    databases = analyzer.find_all_databases()
    
    if not databases:
        print("\n❌ No se encontraron bases de datos SQLite")
        return 1
    
    # Paso 2: Analizar cada BD
    for db_path in databases:
        analysis = analyzer.analyze_database(db_path)
        if analysis:
            analyzer.analysis[str(db_path)] = analysis
    
    # Paso 3: Comparar esquemas
    analyzer.compare_schemas()
    
    # Paso 4: Identificar BD maestra
    master_db = analyzer.find_master_database()
    
    # Paso 5: Consolidar esquemas
    consolidation = analyzer.consolidate_schemas(master_db)
    
    # Paso 6: Generar reporte
    report_path = analyzer.generate_report()
    
    # Paso 7: Mover a Garbage (requiere confirmación)
    print("\n" + "="*70)
    response = input("¿Mover bases de datos obsoletas a Garbage? (s/N): ")
    
    if response.lower() in ['s', 'si', 'sí', 'y', 'yes']:
        analyzer.move_to_garbage(master_db)
        
        # Sugerir ubicación final
        master_path = Path(master_db)
        suggested_path = root_path / 'server' / 'data.db'
        
        print(f"\n📍 Ubicación actual de BD maestra: {master_path.relative_to(root_path)}")
        print(f"📍 Ubicación recomendada (mejores prácticas): {suggested_path.relative_to(root_path)}")
        
        if master_path != suggested_path:
            move_master = input(f"\n¿Mover BD maestra a {suggested_path.relative_to(root_path)}? (s/N): ")
            if move_master.lower() in ['s', 'si', 'sí', 'y', 'yes']:
                import shutil
                shutil.copy2(str(master_path), str(suggested_path))
                print(f"✅ BD maestra copiada a: {suggested_path.relative_to(root_path)}")
    else:
        print("\n⏭️ Operación cancelada. Bases de datos NO modificadas.")
    
    print("\n" + "="*70)
    print("✅ Análisis completado")
    print(f"📄 Ver reporte completo: {report_path}")
    print("="*70)
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
