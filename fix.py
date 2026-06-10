with open(r'C:\Users\aghaa\Desktop\HRM PRO\frontend\src\app\dashboard\employees\page.tsx', encoding='utf-8') as f:
    content = f.read()
content = content.replace("HR_MANAGER: 'bg-blue-100 text-blue-700',", "")
content = content.replace("DEPT_MANAGER: 'bg-yellow-100 text-yellow-700',", "")
content = content.replace("HR_MANAGER: 'HR Manager',", "")
content = content.replace("DEPT_MANAGER: 'Dept Manager',", "")
with open(r'C:\Users\aghaa\Desktop\HRM PRO\frontend\src\app\dashboard\employees\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
