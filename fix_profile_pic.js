const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add profilePic state
content = content.replace(
  "  const [companyInfo, setCompanyInfo] = useState<any>(null);",
  "  const [companyInfo, setCompanyInfo] = useState<any>(null);\n  const [profilePic, setProfilePic] = useState<string | null>(null);\n  const [picUploading, setPicUploading] = useState(false);"
);

// Load profile pic on mount
content = content.replace(
  "    setEditName(user.name || '');",
  "    setEditName(user.name || '');\n      const savedPic = localStorage.getItem('user_profile_pic');\n      if (savedPic) setProfilePic(savedPic);"
);

// Add upload handler before fetchCompanyInfo
content = content.replace(
  "  const fetchCompanyInfo",
  "  const handleProfilePicUpload = (e) => {\n    const file = e.target.files?.[0];\n    if (!file) return;\n    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }\n    setPicUploading(true);\n    const reader = new FileReader();\n    reader.onload = () => {\n      const base64 = reader.result;\n      localStorage.setItem('user_profile_pic', base64);\n      setProfilePic(base64);\n      window.dispatchEvent(new Event('profile_pic_updated'));\n      setPicUploading(false);\n    };\n    reader.readAsDataURL(file);\n  };\n  const fetchCompanyInfo"
);

// Replace avatar with profile pic + upload button
content = content.replace(
  '<div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black flex-shrink-0 shadow-lg"\n              style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>\n              {user.name?.charAt(0)?.toUpperCase() || "?"}\n            </div>',
  '<div className="relative flex-shrink-0"><div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>{profilePic ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black">{user.name?.charAt(0)?.toUpperCase() || "?"}</div>}</div><label className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full cursor-pointer flex items-center justify-center text-sm shadow-lg" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>{picUploading ? "⏳" : "📷"}<input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" /></label></div>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');