# V2 Design Principles
## Production-Ready Visual Design Language

### **Core Philosophy**
Clean, professional, enterprise-ready interface design that prioritizes clarity, consistency, and usability over decorative elements.

### **Visual Principles**

#### **1. Color System**
- **Primary Colors**: Solid backgrounds instead of gradients
  - `bg-blue-600` instead of `bg-gradient-to-r from-blue-500 to-indigo-600`
  - `bg-gray-50` for subtle backgrounds
  - `text-gray-900` for primary text, `text-gray-600` for secondary
- **Status Colors**: Clear, accessible contrast
  - Success: `bg-green-50` with `text-green-600` 
  - Warning: `bg-amber-50` with `text-amber-600`
  - Error: `bg-red-50` with `text-red-600`
  - Info: `bg-blue-50` with `text-blue-600`

#### **2. Typography**
- **Hierarchy**: Clear font weight and size progression
  - Headers: `text-xl font-semibold text-gray-900`
  - Subheaders: `text-lg font-medium text-gray-900`
  - Body: `text-gray-600` or `text-gray-700`
  - Captions: `text-sm text-gray-500`

#### **3. Layout & Spacing**
- **Container Borders**: `border border-gray-200` for subtle definition
- **Rounded Corners**: Consistent `rounded-lg` (8px) across components
- **Spacing**: `gap-3` or `space-x-3` for related elements, `gap-6` for sections
- **Padding**: `p-4` or `p-6` for container content, `px-3 py-2` for buttons

#### **4. Interactive Elements**
- **Buttons**: 
  - Primary: `bg-blue-600 text-white hover:bg-blue-700`
  - Secondary: `bg-white text-gray-700 border border-gray-200 hover:bg-gray-50`
  - Destructive: `bg-red-600 text-white hover:bg-red-700`
- **Icons**: `w-4 h-4` or `w-5 h-5` sizing, consistent with text
- **Icon Containers**: `w-8 h-8` or `w-10 h-10` with `rounded-lg` background

#### **5. Cards & Modals**
- **Background**: Clean white `bg-white`
- **Shadows**: Subtle `shadow-xl` for modals, `shadow-sm` for cards
- **Borders**: `border border-gray-200` for definition
- **Headers**: No gradients, clean separation with `border-b border-gray-200`

#### **6. Effects & Animation**
- **Backdrop**: `bg-black/60 backdrop-blur-sm` for modal overlays
- **Transitions**: Simple `transition-colors` for interactive elements
- **No Complex Effects**: Avoid glassmorphism, complex gradients, or heavy blur effects

### **Component Standards**

#### **Modal Pattern**
```tsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-4xl w-full mx-4">
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Title</h2>
      </div>
      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
        <X className="w-5 h-5" />
      </button>
    </div>
    <div className="p-6">Content</div>
  </div>
</div>
```

#### **Success/Status Banner Pattern**
```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
      <CheckCircle className="w-4 h-4 text-green-600" />
    </div>
    <div>
      <h3 className="text-gray-900 font-medium">Title</h3>
      <p className="text-gray-600 text-sm">Description</p>
    </div>
  </div>
</div>
```

#### **Button Group Pattern**
```tsx
<div className="flex items-center gap-2">
  <button className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
    <Icon className="w-4 h-4" />
    <span>Action</span>
  </button>
</div>
```

### **Anti-Patterns (Avoid)**
- Complex gradients: `bg-gradient-to-r from-blue-500 to-purple-600`
- Glassmorphism effects: `backdrop-blur-lg bg-white/20`
- Inconsistent rounded corners: mixing `rounded-xl`, `rounded-2xl`
- Heavy drop shadows: `shadow-2xl`
- Complex color overlays: `bg-opacity-20`
- Decorative animations or effects
- Inconsistent spacing or sizing

### **Implementation Notes**
- Always prioritize accessibility and readability
- Maintain consistent visual hierarchy
- Use semantic color meanings (green=success, red=error, etc.)
- Keep interface elements clean and purposeful
- Focus on content over decoration
- Ensure touch-friendly sizing for interactive elements