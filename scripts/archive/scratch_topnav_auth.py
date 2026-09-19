import re

with open("frontend/src/components/layout/TopNav.jsx", "r", encoding="utf-8") as f:
    tn = f.read()

# Add a Cloud Save button if not authenticated
old_cloud = """{/* Auto-Save Indicator */}
                <div className={`hidden lg:flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border ${isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-emerald-900/20 border-emerald-800/50 text-emerald-400'}`}>
                    <Cloud className="w-3 h-3" />
                    <span>Saved</span>
                </div>"""

new_cloud = """{/* Auto-Save Indicator */}
                {localStorage.getItem('aurabuild_is_logged_in') ? (
                    <div className={`hidden lg:flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border ${isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-emerald-900/20 border-emerald-800/50 text-emerald-400'}`}>
                        <Cloud className="w-3 h-3" />
                        <span>Saved to Cloud</span>
                    </div>
                ) : (
                    <button 
                        onClick={() => alert("Please return to the Home page to Sign In and save your portfolio to the cloud database permanently!")}
                        className={`hidden lg:flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border transition-colors cursor-pointer ${isLight ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' : 'bg-amber-900/30 border-amber-700/50 text-amber-400 hover:bg-amber-900/50'}`}>
                        <Cloud className="w-3 h-3" />
                        <span>Sign in to Cloud Save</span>
                    </button>
                )}"""

tn = tn.replace(old_cloud, new_cloud)

with open("frontend/src/components/layout/TopNav.jsx", "w", encoding="utf-8") as f:
    f.write(tn)

print("TopNav updated with Cloud Save button.")
