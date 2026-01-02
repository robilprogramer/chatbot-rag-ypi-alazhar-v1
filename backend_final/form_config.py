"""
Dynamic Field Configuration System
Field definitions stored as JSON configuration - easy to modify without code changes
"""

from typing import Dict, List, Optional, Any
from enum import Enum
from pydantic import BaseModel
import json


class FieldType(str, Enum):
    """Types of fields"""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    SELECT = "select"
    PHONE = "phone"
    EMAIL = "email"
    FILE = "file"
    TEXTAREA = "textarea"


class FieldConfig(BaseModel):
    """Configuration for a single field"""
    name: str
    label: str
    type: FieldType
    required: bool = False
    skippable: bool = True
    validation_pattern: Optional[str] = None
    options: Optional[List[str]] = None  # For SELECT type
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    depends_on: Optional[Dict[str, Any]] = None  # Conditional field
    
    def to_dict(self) -> Dict[str, Any]:
        return self.dict(exclude_none=True)


class SectionConfig(BaseModel):
    """Configuration for a section (group of fields)"""
    name: str
    label: str
    description: Optional[str] = None
    fields: List[FieldConfig]
    required_fields: int = 0  # Minimal berapa field yang harus diisi
    skippable: bool = True
    
    def get_required_fields(self) -> List[str]:
        """Get list of required field names"""
        return [f.name for f in self.fields if f.required]
    
    def get_skippable_fields(self) -> List[str]:
        """Get list of skippable field names"""
        return [f.name for f in self.fields if f.skippable]
    
    def is_section_complete(self, data: Dict[str, Any]) -> bool:
        """Check if section has minimal required data"""
        filled_count = sum(1 for f in self.fields if data.get(f.name))
        return filled_count >= self.required_fields
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "label": self.label,
            "description": self.description,
            "fields": [f.to_dict() for f in self.fields],
            "required_fields": self.required_fields,
            "skippable": self.skippable
        }


# ============================================================
# DEFAULT CONFIGURATION - YPI Al-Azhar Registration Form
# ============================================================

DEFAULT_FORM_CONFIG = {
    "form_name": "YPI Al-Azhar Student Registration",
    "version": "1.0",
    "sections": [
        {
            "name": "school_info",
            "label": "Informasi Sekolah",
            "description": "Pilihan sekolah dan program yang dituju",
            "required_fields": 2,  # Minimal 2 field harus diisi
            "skippable": False,
            "fields": [
                {
                    "name": "nama_sekolah",
                    "label": "Nama Sekolah",
                    "type": "select",
                    "required": True,
                    "skippable": False,
                    "options": [
                        "TK Islam Al Azhar 1 Kebayoran Baru",
                        "SD Islam Al Azhar 1 Kebayoran Baru",
                        "SMP Al Azhar 1 Kebayoran Baru",
                        "SMA Al Azhar 1 Kebayoran Baru",
                        "TK Al Azhar Kemang",
                        "SD Al Azhar Kemang"
                    ],
                    "help_text": "Pilih unit sekolah yang dituju"
                },
                {
                    "name": "tahun_ajaran",
                    "label": "Tahun Ajaran",
                    "type": "select",
                    "required": False,
                    "skippable": True,
                    "options": ["2025/2026", "2026/2027"],
                    "help_text": "Tahun ajaran pendaftaran"
                },
                {
                    "name": "program",
                    "label": "Program",
                    "type": "select",
                    "required": True,
                    "skippable": False,
                    "options": ["Reguler", "Bilingual"],
                    "help_text": "Program pembelajaran yang dipilih"
                },
                {
                    "name": "tingkatan",
                    "label": "Tingkatan/Kelas",
                    "type": "select",
                    "required": True,
                    "skippable": False,
                    "options": [
                        "Playgroup", "TK A", "TK B",
                        "Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6",
                        "Kelas 7", "Kelas 8", "Kelas 9",
                        "Kelas 10", "Kelas 11", "Kelas 12"
                    ],
                    "help_text": "Tingkatan kelas yang dituju"
                },
                {
                    "name": "gelombang",
                    "label": "Gelombang Pendaftaran",
                    "type": "text",
                    "required": False,
                    "skippable": True,
                    "placeholder": "PMB Tahun Ajaran 2026/2027"
                }
            ]
        },
        {
            "name": "student_data",
            "label": "Data Siswa",
            "description": "Informasi pribadi calon siswa",
            "required_fields": 3,  # Minimal 3 field
            "skippable": False,
            "fields": [
                {
                    "name": "nama_lengkap",
                    "label": "Nama Lengkap Siswa",
                    "type": "text",
                    "required": True,
                    "skippable": False,
                    "placeholder": "Nama lengkap sesuai akta kelahiran"
                },
                {
                    "name": "tempat_lahir",
                    "label": "Tempat Lahir",
                    "type": "text",
                    "required": True,
                    "skippable": False
                },
                {
                    "name": "tanggal_lahir",
                    "label": "Tanggal Lahir",
                    "type": "date",
                    "required": True,
                    "skippable": False,
                    "validation_pattern": "^\\d{2}/\\d{2}/\\d{4}$",
                    "placeholder": "DD/MM/YYYY"
                },
                {
                    "name": "jenis_kelamin",
                    "label": "Jenis Kelamin",
                    "type": "select",
                    "required": True,
                    "skippable": False,
                    "options": ["Laki-laki", "Perempuan"]
                },
                {
                    "name": "agama",
                    "label": "Agama",
                    "type": "select",
                    "required": False,
                    "skippable": True,
                    "options": ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]
                },
                {
                    "name": "alamat",
                    "label": "Alamat Lengkap",
                    "type": "textarea",
                    "required": False,
                    "skippable": True,
                    "placeholder": "Alamat lengkap tempat tinggal"
                },
                {
                    "name": "no_telepon",
                    "label": "Nomor Telepon Siswa",
                    "type": "phone",
                    "required": False,
                    "skippable": True,
                    "validation_pattern": "^[0-9]{10,15}$"
                },
                {
                    "name": "email",
                    "label": "Email Siswa",
                    "type": "email",
                    "required": False,
                    "skippable": True
                }
            ]
        },
        {
            "name": "parent_data",
            "label": "Data Orang Tua",
            "description": "Informasi orang tua/wali siswa",
            "required_fields": 2,  # Minimal nama + telepon salah satu ortu
            "skippable": False,
            "fields": [
                {
                    "name": "nama_ayah",
                    "label": "Nama Ayah",
                    "type": "text",
                    "required": False,
                    "skippable": True
                },
                {
                    "name": "pekerjaan_ayah",
                    "label": "Pekerjaan Ayah",
                    "type": "text",
                    "required": False,
                    "skippable": True
                },
                {
                    "name": "no_telepon_ayah",
                    "label": "Nomor Telepon Ayah",
                    "type": "phone",
                    "required": False,
                    "skippable": True,
                    "validation_pattern": "^[0-9]{10,15}$"
                },
                {
                    "name": "nama_ibu",
                    "label": "Nama Ibu",
                    "type": "text",
                    "required": False,
                    "skippable": True
                },
                {
                    "name": "pekerjaan_ibu",
                    "label": "Pekerjaan Ibu",
                    "type": "text",
                    "required": False,
                    "skippable": True
                },
                {
                    "name": "no_telepon_ibu",
                    "label": "Nomor Telepon Ibu",
                    "type": "phone",
                    "required": False,
                    "skippable": True,
                    "validation_pattern": "^[0-9]{10,15}$"
                },
                {
                    "name": "nama_wali",
                    "label": "Nama Wali (jika ada)",
                    "type": "text",
                    "required": False,
                    "skippable": True
                },
                {
                    "name": "no_telepon_wali",
                    "label": "Nomor Telepon Wali",
                    "type": "phone",
                    "required": False,
                    "skippable": True,
                    "validation_pattern": "^[0-9]{10,15}$"
                }
            ]
        },
        {
            "name": "academic_data",
            "label": "Data Akademik",
            "description": "Riwayat pendidikan sebelumnya",
            "required_fields": 0,  # Bisa skip semua untuk TK
            "skippable": True,
            "fields": [
                {
                    "name": "nama_sekolah_asal",
                    "label": "Nama Sekolah Asal",
                    "type": "text",
                    "required": False,
                    "skippable": True,
                    "depends_on": {
                        "tingkatan": ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6",
                                     "Kelas 7", "Kelas 8", "Kelas 9", "Kelas 10", "Kelas 11", "Kelas 12"]
                    }
                },
                {
                    "name": "alamat_sekolah_asal",
                    "label": "Alamat Sekolah Asal",
                    "type": "text",
                    "required": False,
                    "skippable": True
                },
                {
                    "name": "tahun_lulus",
                    "label": "Tahun Lulus",
                    "type": "text",
                    "required": False,
                    "skippable": True
                },
                {
                    "name": "nilai_rata_rata",
                    "label": "Nilai Rata-rata",
                    "type": "text",
                    "required": False,
                    "skippable": True
                }
            ]
        },
        {
            "name": "documents",
            "label": "Dokumen Persyaratan",
            "description": "Upload dokumen yang diperlukan",
            "required_fields": 0,  # Bisa upload nanti
            "skippable": True,
            "fields": [
                {
                    "name": "akta_kelahiran",
                    "label": "Akta Kelahiran",
                    "type": "file",
                    "required": False,
                    "skippable": True,
                    "help_text": "Format: PDF, JPG, PNG (Max 5MB)"
                },
                {
                    "name": "kartu_keluarga",
                    "label": "Kartu Keluarga",
                    "type": "file",
                    "required": False,
                    "skippable": True
                },
                {
                    "name": "foto_siswa",
                    "label": "Foto Siswa 3x4",
                    "type": "file",
                    "required": False,
                    "skippable": True
                },
                {
                    "name": "ijazah_terakhir",
                    "label": "Ijazah Terakhir",
                    "type": "file",
                    "required": False,
                    "skippable": True,
                    "depends_on": {
                        "tingkatan": ["Kelas 7", "Kelas 8", "Kelas 9", "Kelas 10", "Kelas 11", "Kelas 12"]
                    }
                },
                {
                    "name": "rapor_terakhir",
                    "label": "Rapor Semester Terakhir",
                    "type": "file",
                    "required": False,
                    "skippable": True
                }
            ]
        }
    ]
}


class FormConfigManager:
    """Manager untuk load dan manage form configuration"""
    
    def __init__(self, config_dict: Optional[Dict] = None):
        """
        Initialize with config dict or use default
        
        Args:
            config_dict: Custom config dict, or None to use default
        """
        if config_dict is None:
            config_dict = DEFAULT_FORM_CONFIG
        
        self.config = config_dict
        self.sections = {}
        
        # Parse sections
        for section_data in config_dict.get("sections", []):
            fields = [FieldConfig(**f) for f in section_data.get("fields", [])]
            section = SectionConfig(
                name=section_data["name"],
                label=section_data["label"],
                description=section_data.get("description"),
                fields=fields,
                required_fields=section_data.get("required_fields", 0),
                skippable=section_data.get("skippable", True)
            )
            self.sections[section.name] = section
    
    def get_section(self, section_name: str) -> Optional[SectionConfig]:
        """Get section configuration by name"""
        return self.sections.get(section_name)
    
    def get_all_sections(self) -> List[SectionConfig]:
        """Get all sections"""
        return list(self.sections.values())
    
    def get_field(self, section_name: str, field_name: str) -> Optional[FieldConfig]:
        """Get specific field configuration"""
        section = self.get_section(section_name)
        if section:
            for field in section.fields:
                if field.name == field_name:
                    return field
        return None
    
    def is_field_required(self, section_name: str, field_name: str, context_data: Dict = None) -> bool:
        """Check if field is required given current context"""
        field = self.get_field(section_name, field_name)
        if not field:
            return False
        
        # Check base requirement
        if not field.required:
            return False
        
        # Check conditional requirement
        if field.depends_on and context_data:
            for key, values in field.depends_on.items():
                if context_data.get(key) not in values:
                    return False  # Condition not met, field not required
        
        return True
    
    def get_missing_required_fields(self, section_name: str, data: Dict[str, Any]) -> List[str]:
        """Get list of missing required fields in a section"""
        section = self.get_section(section_name)
        if not section:
            return []
        
        missing = []
        for field in section.fields:
            if field.required and not data.get(field.name):
                # Check if conditionally required
                if field.depends_on:
                    # Check if condition is met
                    condition_met = True
                    for key, values in field.depends_on.items():
                        if data.get(key) not in values:
                            condition_met = False
                            break
                    if condition_met and not data.get(field.name):
                        missing.append(field.name)
                else:
                    missing.append(field.name)
        
        return missing
    
    def save_config(self, filepath: str):
        """Save configuration to JSON file"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)
    
    @classmethod
    def load_from_file(cls, filepath: str) -> "FormConfigManager":
        """Load configuration from JSON file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            config_dict = json.load(f)
        return cls(config_dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Export as dictionary"""
        return {
            "form_name": self.config.get("form_name"),
            "version": self.config.get("version"),
            "sections": [s.to_dict() for s in self.get_all_sections()]
        }


# Singleton instance
_form_config = None

def get_form_config() -> FormConfigManager:
    """Get singleton form config instance"""
    global _form_config
    if _form_config is None:
        _form_config = FormConfigManager()
    return _form_config


def set_custom_config(config_dict: Dict):
    """Set custom configuration"""
    global _form_config
    _form_config = FormConfigManager(config_dict)


if __name__ == "__main__":
    # Example usage
    config = get_form_config()
    
    print("Form Sections:")
    for section in config.get_all_sections():
        print(f"\n{section.label}")
        print(f"  Required fields: {section.required_fields}")
        print(f"  Fields: {len(section.fields)}")
        for field in section.fields:
            req_marker = "* " if field.required else "  "
            print(f"    {req_marker}{field.label} ({field.type})")
    
    # Save to file
    config.save_config("form_config.json")
    print("\n✅ Configuration saved to form_config.json")
