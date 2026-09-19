import re

with open("frontend/src/canvas/CanvasContainer.jsx", "r", encoding="utf-8") as f:
    cc = f.read()

old_bg = """                ) : globalBgImage ? (
                    <div 
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                            backgroundImage: `url('${globalBgImage}')`,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            opacity: 0.3
                        }}
                    />
                ) : null}"""

new_bg = """                ) : globalBgImage ? (
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[2rem]">
                        <div 
                            className="sticky top-0 left-0 w-full h-[100dvh]"
                            style={{
                                backgroundImage: `url('${globalBgImage}')`,
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                opacity: 0.3
                            }}
                        />
                    </div>
                ) : null}"""

cc = cc.replace(old_bg, new_bg)

with open("frontend/src/canvas/CanvasContainer.jsx", "w", encoding="utf-8") as f:
    f.write(cc)

print("CanvasContainer globalBg fixed.")
