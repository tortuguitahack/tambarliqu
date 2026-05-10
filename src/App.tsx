import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useScroll, useMotionTemplate } from 'motion/react';
import { 
  ShoppingBag, 
  ChevronRight, 
  ChevronLeft,
  MessageSquare, 
  X, 
  Send, 
  Sparkles,
  ArrowRight,
  Menu,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Music,
  Phone,
  Share2,
  Plus,
  Link,
  Key,
  Filter,
  ChevronDown,
  Scale,
  ArrowLeft,
  Check,
  Camera,
  Home,
  Image as ImageIcon,
  Wine,
  Trash2,
  MapPin,
  Navigation,
  BookOpen,
  Heart
} from 'lucide-react';
import { generateBottleImage, getSommelierResponse, generateHeroImage, generateProductGallery, getStoreLocations, generateSommelierImage, analyzeFlavorSignature, getProductNarrative } from './lib/gemini';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  imagePrompt: string;
  imageUrl?: string;
  tastingNotes: string;
  origin: string;
  pairings: string;
  isExclusive?: boolean;
  isFeatured?: boolean;
  gallery?: string[];
  narrative?: string;
  flavorProfile?: {
    sweetness: number;
    complexity: number;
    intensity: number;
    oak: number;
    finish: number;
  };
}

const FlavorRadar = ({ profile }: { profile: Product['flavorProfile'] }) => {
  if (!profile) return null;
  const size = 200;
  const center = size / 2;
  const radius = size * 0.35;
  const points = [
    { label: 'Dulzor', value: profile.sweetness },
    { label: 'Complejidad', value: profile.complexity },
    { label: 'Intensidad', value: profile.intensity },
    { label: 'Roble', value: profile.oak },
    { label: 'Final', value: profile.finish },
  ];

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / points.length - Math.PI / 2;
    const r = (value / 100) * radius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  };

  const path = points.map((p, i) => getPoint(i, p.value)).join(' ');
  const gridPath = [0.25, 0.5, 0.75, 1].map(scale => {
    return points.map((_, i) => getPoint(i, 100 * scale)).join(' ');
  });

  return (
    <div className="flex flex-col items-center">
      <h4 className="text-[10px] uppercase tracking-[0.3em] text-gold mb-6">AI Flavor Signature</h4>
      <div className="relative">
        <svg width={size} height={size} className="overflow-visible">
          {/* Grids */}
          {gridPath.map((p, i) => (
            <polygon key={i} points={p} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          {/* Axis */}
          {points.map((_, i) => {
            const end = getPoint(i, 110);
            return <line key={i} x1={center} y1={center} x2={end.split(',')[0]} y2={end.split(',')[1]} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
          })}
          {/* Data */}
          <motion.polygon
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            points={path}
            fill="rgba(212,175,55,0.2)"
            stroke="#D4AF37"
            strokeWidth="2"
            className="filter drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
          />
          {/* Labels */}
          {points.map((p, i) => {
            const end = getPoint(i, 130);
            const [x, y] = end.split(',').map(Number);
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                className="fill-gray-500 text-[8px] uppercase tracking-widest font-bold"
              >
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Baileys Reserve Privée 2026',
    description: 'La máxima expresión del refinamiento. Una experiencia sensorial inigualable, definida por una textura aterciopelada que envuelve el paladar en un abrazo de seda. Esta edición limitada armoniza la nobleza del whisky irlandés con la untuosidad de la crema premium, matizada por la profundidad del cacao puro y la elegancia orquestal de la vainilla de Madagascar. Una indulgencia absoluta.',
    price: '210 Bs.',
    category: 'Licores',
    imagePrompt: 'Luxurious cream liqueur bottle, Baileys style, gold embossed label, velvety texture, elegant studio lighting, pure black background.',
    imageUrl: '/images/download.jpeg',
    tastingNotes: 'Textura sedosa con ricas notas de chocolate, vainilla y un toque de café.',
    origin: 'Irlanda',
    pairings: 'Postres de chocolate, café o simplemente con hielo.',
    flavorProfile: { sweetness: 90, complexity: 40, intensity: 50, oak: 10, finish: 60 }
  },
  {
    id: '2',
    name: 'Johnnie Walker Blue Label Ghost',
    description: 'La cumbre de la maestría. Una mezcla extraordinariamente excepcional de los whiskies más raros de Escocia, ofreciendo una sinfonía inigualable de humo aterciopelado y chocolate amargo.',
    price: '1,890 Bs.',
    category: 'Whisky',
    imagePrompt: 'Ultra-luxury Johnnie Walker Blue Label bottle, rare ghost edition, deep blue glass, gold metallic details, prestigious studio lighting, pure obsidian background.',
    imageUrl: '/images/download (1).jpeg',
    tastingNotes: 'Capas complejas de fruta, miel, jerez y un final ahumado persistente.',
    origin: 'Escocia',
    pairings: 'Chocolate amargo, frutos secos o un buen puro.',
    isExclusive: true,
    flavorProfile: { sweetness: 30, complexity: 95, intensity: 80, oak: 70, finish: 90 }
  },
  {
    id: '3',
    name: 'Gold Label Reserve Luminance',
    description: 'Un néctar dorado resplandeciente. Este whisky despliega una textura voluptuosa con capas de miel de brezo, frutas de huerto maduras y un final envolvente.',
    price: '640 Bs.',
    category: 'Whisky',
    imagePrompt: 'Johnnie Walker Gold Label bottle, glowing golden liquid, brilliant gold label, dramatic rim lighting, luxury product photography, black background.',
    imageUrl: '/images/download (2).jpeg',
    tastingNotes: 'Notas de néctar, flores silvestres y un sutil toque de humo.',
    origin: 'Escocia',
    pairings: 'Salmón ahumado, quesos suaves o postres de manzana.',
    isFeatured: true,
    flavorProfile: { sweetness: 60, complexity: 70, intensity: 60, oak: 40, finish: 75 }
  },
  {
    id: '4',
    name: 'Johnnie Walker Green Label 15',
    description: 'La odisea de los maltas. Revela un carácter vibrante entrelazando bosque húmedo, sándalo aromático y un humo de turba sutilmente refinado.',
    price: '450 Bs.',
    category: 'Whisky',
    imagePrompt: 'Johnnie Walker Green Label bottle, emerald green glass, luxury textures, studio lighting, professional advertising shot, dark background.',
    imageUrl: '/images/download (3).jpeg',
    tastingNotes: 'Aromas de pino, sándalo y frutas frescas con un final terroso.',
    origin: 'Escocia',
    pairings: 'Carnes a la brasa, quesos curados o chocolate con sal.'
  },
  {
    id: '5',
    name: 'Don Julio 1942 Añejo',
    description: 'El alma del agave. Este tequila añejo de producción limitada madura pacientemente, revelando una complejidad sublime de caramelo sedoso y roble tostado.',
    price: '1,200 Bs.',
    category: 'Tequila',
    imagePrompt: 'Tall slender bottle of Don Julio 1942 Tequila, amber liquid glow, iconic design, luxury photography, pure black background.',
    imageUrl: '/images/download (4).jpeg',
    tastingNotes: 'Rico aroma de agave cocido, roble y un final suave de especias.',
    origin: 'México',
    pairings: 'Cortes de carne premium, mariscos frescos o solo.',
    isExclusive: true
  },
  {
    id: '6',
    name: 'Hendrick\'s Lunar Essence',
    description: 'Destilada bajo la luz de la luna. Una ginebra inusualmente exquisita con una sinfonía botánica coronada con pétalos de rosa y pepino fresco.',
    price: '320 Bs.',
    category: 'Gin',
    imagePrompt: "Hendrick's Gin apothecary bottle, dark vintage glass, premium labeling, botanical accents, dramatic studio lighting, obsidian background.",
    imageUrl: '/images/download (5).jpeg',
    tastingNotes: 'Equilibrio perfecto entre enebro, cítricos y notas florales.',
    origin: 'Escocia',
    pairings: 'Tónica premium, pepino fresco y pimienta negra.'
  },
  {
    id: '7',
    name: 'Grey Goose L\'Élixir',
    description: 'La quintaesencia francesa. Destilado a partir del trigo de invierno más fino, logrando una pureza cristalina y una suavidad incomparable.',
    price: '380 Bs.',
    category: 'Vodka',
    imagePrompt: 'Grey Goose Vodka bottle, frosted glass, elegant blue designs, luxury product lighting, cinematic, pure black background.',
    imageUrl: '/images/download (6).jpeg',
    tastingNotes: 'Claridad excepcional con notas de almendra y un final limpio.',
    origin: 'Francia',
    pairings: 'Ostras, caviar o en un Martini clásico.'
  },
  {
    id: '8',
    name: 'Zacapa Centenario 23',
    description: 'Nacido de la tierra volcánica. Un tapiz líquido de miel virgen, frutas pasas, especias cálidas y roble antiguo.',
    price: '490 Bs.',
    category: 'Ron',
    imagePrompt: 'Ron Zacapa 23 bottle, deep amber rum, woven band, luxury presentation, soft golden lighting, black background.',
    imageUrl: '/images/download (7).jpeg',
    tastingNotes: 'Dulzor complejo de caramelo, roble tostado y vainilla.',
    origin: 'Guatemala',
    pairings: 'Chocolate negro o solo.',
    isFeatured: true
  },
  {
    id: '9',
    name: 'Buchanan\'s 18 Special Reserve',
    description: 'Un blend extraordinario madurado por 18 años con suavidad sedosa.',
    price: '780 Bs.',
    category: 'Whisky',
    imagePrompt: 'Buchanans 18 bottle luxury lighting.',
    imageUrl: '/images/download (8).jpeg',
    tastingNotes: 'Miel de brezo, chocolate amargo.',
    origin: 'Escocia',
    pairings: 'Puros media intensidad.'
  },
  {
    id: '10',
    name: 'Chivas Regal 18 Gold',
    description: 'La maestría del Master Blender Colin Scott.',
    price: '620 Bs.',
    category: 'Whisky',
    imagePrompt: 'Chivas 18 luxury photography.',
    imageUrl: '/images/download (9).jpeg',
    tastingNotes: 'Chocolate negro, toffee.',
    origin: 'Escocia',
    pairings: 'Quesos de cabra.'
  },
  {
    id: '11',
    name: 'Tanqueray No. TEN Heritage',
    description: 'Ginebra destilada con cítricos frescos.',
    price: '340 Bs.',
    category: 'Gin',
    imagePrompt: 'Tanqueray Ten bottle green glass.',
    imageUrl: '/images/download (10).jpeg',
    tastingNotes: 'Toronja fresca, enebro.',
    origin: 'Inglaterra',
    pairings: 'Martinis clásicos.'
  },
  {
    id: '12',
    name: 'Cuervo Reserva Familia',
    description: 'El orgullo de la destilería La Rojeña.',
    price: '1,450 Bs.',
    category: 'Tequila',
    imagePrompt: 'Reserva Familia bottle luxury.',
    imageUrl: '/images/download (11).jpeg',
    tastingNotes: 'Roble tostado, agave.',
    origin: 'México',
    pairings: 'Comida mexicana gourmet.'
  },
  {
    id: '13',
    name: 'Moët & Chandon Imperial',
    description: 'El champán más amado vibrante y seductor.',
    price: '680 Bs.',
    category: 'Champagne',
    imagePrompt: 'Moet bottle pure black foreground.',
    imageUrl: '/images/download (12).jpeg',
    tastingNotes: 'Manzana verde, brioche.',
    origin: 'Francia',
    pairings: 'Sushi, mariscos.'
  },
  {
    id: '14',
    name: 'Hennessy X.O Excellence',
    description: 'El Cognac original desde 1870.',
    price: '2,400 Bs.',
    category: 'Cognac',
    imagePrompt: 'Hennessy XO iconic amber glow.',
    imageUrl: '/images/download (13).jpeg',
    tastingNotes: 'Especias cálidas, higos.',
    origin: 'Francia',
    pairings: 'Chocolate amargo.'
  },
  {
    id: '15',
    name: 'Macallan 12 Double Cask',
    description: 'La armonía perfecta del roble.',
    price: '790 Bs.',
    category: 'Whisky',
    imagePrompt: 'Macallan 12 bottle luxury.',
    imageUrl: '/images/download (14).jpeg',
    tastingNotes: 'Caramelo, miel, jengibre.',
    origin: 'Escocia',
    pairings: 'Risottos, carnes blancas.'
  },
  {
    id: '16',
    name: 'Singleton 12 Dufftown',
    description: 'Suave y rico equilibrio perfecto.',
    price: '390 Bs.',
    category: 'Whisky',
    imagePrompt: 'Singleton bottle teal accents.',
    imageUrl: '/images/download (15).jpeg',
    tastingNotes: 'Frutas frescas, miel.',
    origin: 'Escocia',
    pairings: 'Frutos secos, quesos suaves.'
  },
  {
    id: '17',
    name: 'Dom Pérignon Vintage',
    description: 'La aspiración a la perfección absoluta.',
    price: '3,200 Bs.',
    category: 'Champagne',
    imagePrompt: 'Dom Perignon black luxury bottle.',
    imageUrl: '/images/download (16).jpeg',
    tastingNotes: 'Complejidad mineral, especias.',
    origin: 'Francia',
    pairings: 'Caviar, mariscos.'
  },
  {
    id: '18',
    name: 'Cardhu 12 Years Old',
    description: 'El corazón cálido de Speyside.',
    price: '450 Bs.',
    category: 'Whisky',
    imagePrompt: 'Cardhu bottle warm honey glow.',
    imageUrl: '/images/download (17).jpeg',
    tastingNotes: 'Miel, roble suave.',
    origin: 'Escocia',
    pairings: 'Quesos cremosos.'
  },
  {
    id: '19',
    name: 'Absolut Elyx Luxury',
    description: 'El vodka de cobre destilado en alambiques de 1921.',
    price: '420 Bs.',
    category: 'Vodka',
    imagePrompt: 'Absolut Elyx copper bottle.',
    imageUrl: '/images/download (18).jpeg',
    tastingNotes: 'Pan horneado, nueces.',
    origin: 'Suecia',
    pairings: 'Pescados ahumados.'
  },
  {
    id: '20',
    name: 'JW Double Black',
    description: 'La intensidad del humo amplificada.',
    price: '390 Bs.',
    category: 'Whisky',
    imagePrompt: 'JW Double Black intense smoke.',
    imageUrl: '/images/download (19).jpeg',
    tastingNotes: 'Humo intenso, vainilla.',
    origin: 'Escocia',
    pairings: 'Carnes parrilla.'
  }
];

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-white/5 rounded-lg ${className}`}>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      animate={{
        x: ['-100%', '100%'],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  </div>
);

const ZoomableImage = ({ src, alt }: { src: string; alt: string }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const originX = useMotionValue(50);
  const originY = useMotionValue(50);
  const springX = useSpring(originX, { stiffness: 100, damping: 20 });
  const springY = useSpring(originY, { stiffness: 100, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    originX.set(x);
    originY.set(y);
  };

  const transformOrigin = useMotionTemplate`${springX}% ${springY}%`;

  return (
    <div 
      className="relative w-full h-full overflow-hidden cursor-zoom-in group"
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => { 
        setIsZoomed(false); 
        originX.set(50); 
        originY.set(50); 
      }}
      onMouseMove={handleMouseMove}
      onClick={() => setIsZoomed(!isZoomed)}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      <motion.img
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        className="w-full h-full object-contain"
        style={{
          transformOrigin,
          scale: isZoomed ? 3.5 : 1, // Ultra-zoom for detail inspection
          opacity: isLoading ? 0 : 1
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 30 }}
        referrerPolicy="no-referrer"
      />
      
      <AnimatePresence>
        {!isZoomed && !isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex flex-col items-center justify-center p-4 text-center pointer-events-none"
          >
            <Sparkles className="w-8 h-8 text-gold mb-2 transition-transform duration-500 group-hover:scale-125" />
            <span className="text-[10px] text-gold font-serif italic tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">
              HOVER TO ZOOM
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {isZoomed && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-full border border-gold/30 z-30 pointer-events-none whitespace-nowrap"
        >
          <span className="text-gold text-[10px] uppercase tracking-[0.2em] font-medium shadow-sm">
            Pan to inspect fine craftsman detail
          </span>
        </motion.div>
      )}
    </div>
  );
};

function ProductCardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="aspect-[3/4] rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="flex justify-between items-end pt-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-3 w-16 ml-auto" />
              <Skeleton className="h-6 w-20 ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tooltip component for luxury feel
const Tooltip = ({ children, text }: { children: React.ReactNode, text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex flex-col items-center group/tooltip" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mb-2 z-[70] px-3 py-1.5 glass border border-gold/30 rounded-lg whitespace-nowrap pointer-events-none"
          >
            <span className="text-[9px] uppercase tracking-[0.2em] text-gold font-bold">{text}</span>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 glass border-t border-l border-gold/30 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductCard: React.FC<{ 
  product: Product; 
  index: number; 
  onCompare: (id: string) => void;
  onWishlist: (id: string) => void;
  onAddToCart: (id: string) => void;
  isComparing: boolean;
  isWishlisted: boolean;
  onClick: () => void;
  onImageGenerated: (id: string, url: string) => void;
}> = ({ 
  product, 
  index, 
  onCompare, 
  onWishlist,
  onAddToCart,
  isComparing,
  isWishlisted,
  onClick,
  onImageGenerated
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  });

  const translateY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["25deg", "-25deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-25deg", "25deg"]);
  
  const imgRotateX = useTransform(mouseYSpring, [-0.5, 0.5], [15, -15]);
  const imgRotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-15, 15]);
  const imgTranslateX = useTransform(mouseXSpring, [-0.5, 0.5], ["-20px", "20px"]);
  const imgTranslateY = useTransform(mouseYSpring, [-0.5, 0.5], ["-20px", "20px"]);
  
  const shadowX = useTransform(mouseXSpring, [-0.5, 0.5], ["40px", "-40px"]);
  const shadowY = useTransform(mouseYSpring, [-0.5, 0.5], ["60px", "-60px"]);
  const dropShadow = useMotionTemplate`drop-shadow(${shadowX} ${shadowY} 35px rgba(212,175,55,${product.isExclusive ? '0.6' : product.isFeatured ? '0.3' : '0.4'})) drop-shadow(0 0 20px rgba(212,175,55,${product.isExclusive ? '0.7' : product.isFeatured ? '0.4' : '0.5'}))`;

  const shimmerBackground = useTransform(
    [mouseXSpring, mouseYSpring],
    ([x, y]) => `radial-gradient(circle at ${50 + (x as number) * 100}% ${50 + (y as number) * 100}%, rgba(212, 175, 55, 0.6) 0%, transparent 70%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Descubre ${product.name} en TAMBAR - La Esencia del Lujo Líquido.`;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'instagram':
        shareUrl = `https://www.instagram.com/`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        // We could add a toast here if we had a toast system
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewportEnter = async () => {
    if (!product.imageUrl && !isGeneratingLocal) {
      setIsGeneratingLocal(true);
      const url = await generateBottleImage(product.imagePrompt, product.id);
      const finalUrl = url === "ERROR_PERMISSION_DENIED" || !url
        ? `https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=800&auto=format&fit=crop`
        : url;
      onImageGenerated(product.id, finalUrl);
      setIsGeneratingLocal(false);
    }
  };

  return (
    <motion.div 
      ref={cardRef}
      className={`group relative cursor-pointer ${product.isExclusive ? 'exclusive-card' : ''} ${product.isFeatured ? 'featured-card' : ''} flex flex-col items-center text-center`}
      style={{ perspective: "1200px" }}
      onClick={onClick}
      onViewportEnter={handleViewportEnter}
      viewport={{ once: true, margin: "200px" }}
      onMouseEnter={() => {
        handleViewportEnter();
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        handleMouseLeave();
        setIsHovered(false);
      }}
    >
      <motion.div 
        className="relative w-full"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover="hover"
        transition={{ 
          delay: index * 0.1,
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        viewport={{ once: true }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Quick View Hover Modal */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute inset-0 z-[60] p-4 flex items-center justify-center pointer-events-none"
            >
              <div className="glass w-full h-full rounded-2xl border border-gold/40 shadow-[0_0_50px_rgba(212,175,55,0.3)] flex flex-col p-6 pointer-events-auto backdrop-blur-xl bg-black/60">
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-32 h-32 mb-4"
                  >
                    {product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(212,175,55,0.5)]" 
                      />
                    )}
                  </motion.div>
                  <motion.h4 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white font-serif italic text-xl mb-1 text-center"
                  >
                    {product.name}
                  </motion.h4>
                  <motion.p 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-gold font-bold tracking-widest text-lg mb-4"
                  >
                    {product.price}
                  </motion.p>
                </div>
                
                <Tooltip text="Añadir a tu colección personal">
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02, backgroundColor: "#fff", color: "#000" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product.id);
                    }}
                    className="w-full bg-gold text-black py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={14} />
                    Añadir al Carrito
                  </motion.button>
                </Tooltip>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="mt-3 w-full border border-white/10 hover:border-gold/50 py-2 rounded-xl text-[9px] uppercase tracking-widest text-gray-400 transition-all"
                >
                  Ver detalles completos
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {(!product.imageUrl || !isLoaded) && (
          <div className="absolute top-0 left-0 w-full h-full z-20 bg-[#0a0a0a]">
            <ProductCardSkeleton />
          </div>
        )}

          <motion.div 
            style={{
              transformStyle: "preserve-3d",
            }}
            className="aspect-[3/4] w-full rounded-2xl mb-6 relative shadow-2xl transition-all duration-500 group-hover:shadow-[0_20px_40px_rgba(212,175,55,0.2)]"
          >
            {/* Card Base Layer */}
            <div className={`absolute inset-0 bg-[#111] rounded-2xl border overflow-hidden ${
              product.isExclusive ? 'border-gold/30 shadow-[inset_0_0_20px_rgba(212,175,55,0.1)]' : 
              product.isFeatured ? 'border-white/30 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' : 
              'border-white/10'
            }`} style={{ transform: "translateZ(0px)" }}>
              {/* Holographic Shimmer Overlay */}
              <motion.div 
                className="absolute inset-0 z-10 opacity-0 group-hover:opacity-40 pointer-events-none transition-opacity duration-500"
                style={{
                  background: shimmerBackground,
                  mixBlendMode: 'color-dodge',
                }}
              />
              
              {/* Exclusive Sparkles */}
              {product.isExclusive && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-gold rounded-full"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                        x: [Math.random() * 200, Math.random() * 200],
                        y: [Math.random() * 300, Math.random() * 300]
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 5
                      }}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        boxShadow: "0 0 10px #d4af37"
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Shimmer Sweep Effect */}
              <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                <motion.div 
                  className="w-full h-[200%] bg-gradient-to-b from-transparent via-white/10 to-transparent -rotate-45"
                  initial={{ x: "-100%", y: "-100%" }}
                  animate={product.isExclusive ? {
                    x: ["-100%", "100%"],
                    y: ["-100%", "100%"]
                  } : {}}
                  transition={product.isExclusive ? {
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut"
                  } : {}}
                  variants={{
                    hover: { 
                      x: "100%", 
                      y: "100%",
                      transition: { duration: 1.5, repeat: Infinity, repeatDelay: 0.5 } 
                    }
                  }}
                />
              </div>
            </div>

            {/* Product Image Container */}
            <motion.div
              className="absolute inset-0 pointer-events-none flex items-center justify-center p-8"
              style={{
                z: 100,
                transformStyle: "preserve-3d"
              }}
              variants={{
                hover: {
                  z: 200,
                  scale: 1.1,
                  y: -10,
                  transition: { duration: 0.5, type: "spring", stiffness: 150, damping: 15 }
                }
              }}
            >
              {product.imageUrl && (
                <motion.img 
                  src={product.imageUrl} 
                  alt={product.name}
                  loading="lazy"
                  onLoad={() => setIsLoaded(true)}
                  className={`w-full h-full object-contain transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    y: translateY,
                    x: imgTranslateX,
                    rotateX: imgRotateX,
                    rotateY: imgRotateY,
                    filter: dropShadow,
                    scale: 1.1,
                    mixBlendMode: 'screen'
                  }}
                  referrerPolicy="no-referrer"
                />
              )}
            </motion.div>

            {/* Badges and Comparison - High Symmetry */}
            <div className="absolute top-6 right-6 flex flex-col items-end space-y-3 z-[70]" style={{ transform: "translateZ(150px)" }}>
              {product.isExclusive && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gold text-black px-4 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] font-black shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center gap-2"
                >
                  <Sparkles size={10} className="animate-pulse" />
                  Exclusivo
                </motion.div>
              )}
              <div className="flex flex-col gap-2">
                <Tooltip text={isComparing ? "Remover de la comparación" : "Comparar este elixir con otros"}>
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(212,175,55,1)", color: "#000" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onCompare(product.id); }}
                    className={`glass p-3 rounded-full border transition-all duration-500 shadow-xl ${
                      isComparing ? 'bg-gold text-black border-gold' : 'text-white border-white/10 hover:border-gold/50'
                    }`}
                  >
                    {isComparing ? <Check size={14} /> : <Scale size={14} />}
                  </motion.button>
                </Tooltip>
                
                <Tooltip text={isWishlisted ? "Quitar de favoritos" : "Añadir a tu cava personal de deseos"}>
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: isWishlisted ? "transparent" : "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onWishlist(product.id); }}
                    className={`glass p-3 rounded-full border transition-all duration-500 shadow-xl ${
                      isWishlisted ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'text-white border-white/10 hover:border-red-500/50'
                    }`}
                  >
                    <Heart size={14} fill={isWishlisted ? "currentColor" : "none"} />
                  </motion.button>
                </Tooltip>
              </div>
            </div>

            {/* Add to Cart Button */}
            <motion.div 
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out"
              style={{ transform: "translateZ(100px) translateX(-50%)" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Tooltip text="Añadir este elixir a tu carrito de compras">
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddToCart(product.id); }}
                  className="glass px-6 py-3 rounded-full flex items-center space-x-2 text-white hover:bg-gold hover:text-black transition-all duration-300 border border-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Añadir al Carrito</span>
                </button>
              </Tooltip>
            </motion.div>
          </motion.div>
          
          {/* Text Section - Perfectly Symmetrical */}
          <motion.div 
            className="w-full flex flex-col items-center"
            style={{ transform: "translateZ(50px)" }}
            initial={{ opacity: 0.8 }}
            whileHover={{ opacity: 1, y: -5 }}
          >
            <span className="text-gold text-[10px] uppercase tracking-[0.4em] mb-3 block font-bold">
              {product.origin} • {product.category}
            </span>
            <h3 className="text-luxury text-3xl mb-3 font-serif italic tracking-tight group-hover:scale-110 transition-transform duration-500">
              {product.name}
            </h3>
            <div className="flex items-center justify-center gap-6 mb-4">
              <span className="h-px w-10 bg-gold/20 group-hover:w-16 transition-all duration-700"></span>
              <p className="text-white font-serif text-xl tracking-widest">{product.price}</p>
              <span className="h-px w-10 bg-gold/20 group-hover:w-16 transition-all duration-700"></span>
            </div>
            
            <motion.p 
              className="text-gray-400 text-[10px] uppercase tracking-widest max-w-[280px] leading-relaxed opacity-0 group-hover:opacity-60 h-0 group-hover:h-auto overflow-hidden transition-all duration-700 ease-in-out font-medium"
            >
              {product.description.substring(0, 80)}...
            </motion.p>
          </motion.div>
        </motion.div>
    </motion.div>
  );
}

export default function App() {
  const [isApiKeySelected, setIsApiKeySelected] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', parts: { text?: string, inlineData?: { mimeType: string, data: string } }[] }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(() => localStorage.getItem('tambar_selectedCategory') || 'Todos');
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('tambar_sortBy') || 'default');
  const [compareList, setCompareList] = useState<string[]>(() => {
    const saved = localStorage.getItem('tambar_compareList');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('tambar_wishlist');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [cart, setCart] = useState<{ id: string, quantity: number }[]>(() => {
    const saved = localStorage.getItem('tambar_cart');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [showComparison, setShowComparison] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [sommelierImage, setSommelierImage] = useState<string | null>(null);
  const [heroAspectRatio, setHeroAspectRatio] = useState<string>("16:9");
  const [isGeneratingHero, setIsGeneratingHero] = useState(false);
  const [productGallery, setProductGallery] = useState<string[]>([]);
  const [isGeneratingGallery, setIsGeneratingGallery] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewedProducts, setViewedProducts] = useState<string[]>(() => {
    const saved = localStorage.getItem('tambar_viewedProducts');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [storeQuery, setStoreQuery] = useState('');
  const [storeResults, setStoreResults] = useState<{text: string, grounding: any} | null>(null);
  const [isSearchingStores, setIsSearchingStores] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState(0);
  const itemsPerPage = 8;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 200]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    localStorage.setItem('tambar_selectedCategory', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    localStorage.setItem('tambar_sortBy', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('tambar_compareList', JSON.stringify(compareList));
  }, [compareList]);

  useEffect(() => {
    localStorage.setItem('tambar_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('tambar_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('tambar_viewedProducts', JSON.stringify(viewedProducts));
  }, [viewedProducts]);

  useEffect(() => {
    if (productGallery.length > 0) {
      productGallery.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [productGallery]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      if (!selectedProduct.flavorProfile) {
        analyzeFlavorSignature(selectedProduct.name, selectedProduct.description).then(profile => {
          setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, flavorProfile: profile } : p));
          setSelectedProduct(prev => prev && prev.id === selectedProduct.id ? { ...prev, flavorProfile: profile } : prev);
        });
      }

      if ((selectedProduct.isExclusive || selectedProduct.isFeatured) && !selectedProduct.narrative) {
        getProductNarrative(selectedProduct.name, selectedProduct.category, selectedProduct.origin, selectedProduct.tastingNotes).then(narrative => {
          if (narrative) {
            setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, narrative } : p));
            setSelectedProduct(prev => prev && prev.id === selectedProduct.id ? { ...prev, narrative } : prev);
          }
        });
      }

      const mainImage = selectedProduct.imageUrl || '';
      if (selectedProduct.gallery) {
        setProductGallery([mainImage, ...selectedProduct.gallery].filter(img => img !== ''));
        setCurrentGalleryIndex(0);
        setIsGeneratingGallery(false);
      } else {
        setProductGallery([mainImage].filter(img => img !== ''));
        setCurrentGalleryIndex(0);
        setIsGeneratingGallery(true);
        
        generateProductGallery(selectedProduct.name, selectedProduct.id).then(images => {
          const newGallery = [mainImage, ...images].filter(img => img !== '');
          setProductGallery(newGallery);
          handleGalleryGenerated(selectedProduct.id, images);
          setIsGeneratingGallery(false);
        });
      }
    } else {
      setProductGallery([]);
      setCurrentGalleryIndex(0);
      setIsGeneratingGallery(false);
    }
  }, [selectedProduct]);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsApiKeySelected(hasKey);
      } else {
        setIsApiKeySelected(true); // Fallback if not in AI Studio
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    if (isApiKeySelected && products.some(p => !p.imageUrl)) {
      const warmupImages = async () => {
        for (const product of products) {
          if (!product.imageUrl) {
            try {
              const url = await generateBottleImage(product.imagePrompt, product.id);
              if (url && url !== "ERROR_PERMISSION_DENIED") {
                handleImageGenerated(product.id, url);
              }
            } catch (e) {
              console.error(`Warmup failed for ${product.name}`, e);
            }
          }
        }
      };
      warmupImages();
    }
  }, [isApiKeySelected]);

  useEffect(() => {
    if (isApiKeySelected) {
      setIsGeneratingHero(true);
      generateHeroImage(heroAspectRatio).then(url => {
        if (url === "ERROR_PERMISSION_DENIED") {
          setIsApiKeySelected(false);
          setHeroImage("https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop");
        } else {
          setHeroImage(url);
        }
        setIsGeneratingHero(false);
      });

      generateSommelierImage().then(url => {
        setSommelierImage(url);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiKeySelected]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSelectApiKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setIsApiKeySelected(true); // Assume success to avoid race condition
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when category/sort changes
  }, [selectedCategory, sortBy]);

  if (isApiKeySelected === false) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full glass p-8 rounded-2xl text-center space-y-6">
          <Wine className="w-16 h-16 text-gold mx-auto mb-4" />
          <h1 className="text-3xl font-serif text-gold">TAMBAR</h1>
          <p className="text-gray-400">
            Para disfrutar de la experiencia completa con imágenes de alta calidad generadas por IA, por favor selecciona tu clave de API de Gemini.
          </p>
          <button
            onClick={handleSelectApiKey}
            className="w-full bg-gold text-black font-bold py-3 px-6 rounded-full hover:bg-white transition-colors"
          >
            Seleccionar Clave API
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Asegúrate de tener un proyecto de Google Cloud con facturación habilitada.
          </p>
        </div>
      </div>
    );
  }

  if (isApiKeySelected === null) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const categories = ['Todos', ...Array.from(new Set(INITIAL_PRODUCTS.map(p => p.category)))];

  const parsePrice = (priceStr: string) => {
    return parseInt(priceStr.replace(/[^\d]/g, ''), 10);
  };

  const filteredProducts = products
    .filter(p => selectedCategory === 'Todos' || p.category === selectedCategory);

  const filteredAndSortedProducts = [...filteredProducts]
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price-asc') return parsePrice(a.price) - parsePrice(b.price);
      if (sortBy === 'price-desc') return parsePrice(b.price) - parsePrice(a.price);
      return 0;
    });

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleImageGenerated = (id: string, url: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, imageUrl: url } : p));
  };

  const handleGalleryGenerated = (id: string, gallery: string[]) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, gallery } : p));
  };

  const sendMessage = async (message: string, image: string | null) => {
    if (!message.trim() && !image) return;

    const parts: any[] = [];
    if (message.trim()) parts.push({ text: message });
    if (image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: image.split(',')[1]
        }
      });
    }

    const userMsg = { role: 'user' as const, parts };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setSelectedImage(null);
    setSuggestions([]);
    setIsTyping(true);

    try {
      const response = await getSommelierResponse(message, chatHistory, image || undefined);
      if (response === "ERROR_PERMISSION_DENIED") {
        setChatHistory(prev => [...prev, { role: 'model' as const, parts: [{ text: "Lo siento, parece que hay un problema con los permisos de la API. Por favor, asegúrate de haber conectado una API Key válida con facturación habilitada para acceder a las funciones avanzadas del Sommelier." }] }]);
        return;
      }
      if (response && typeof response === 'object') {
        setChatHistory(prev => [...prev, { role: 'model' as const, parts: [{ text: response.text }] }]);
        setSuggestions(response.suggestions || []);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(chatMessage, selectedImage);
  };

  const handleDeepDive = async () => {
    const prompt = "Háblame sobre la importancia histórica y el impacto cultural de diferentes categorías de destilados, como el whisky escocés, el whisky japonés, el coñac y los rones añejos. Profundiza en su historia.";
    sendMessage(prompt, null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareList(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 4) {
        // We could add a notification here, but for now we just restrict
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleWishlist = (id: string) => {
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: productId, quantity: 1 }];
    });
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.95
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    const nextIndex = (currentGalleryIndex + newDirection + productGallery.length) % productGallery.length;
    setDirection(newDirection);
    setCurrentGalleryIndex(nextIndex);
  };

  const comparedProducts = products.filter(p => compareList.includes(p.id));

  if (showComparison) {
    const ComparisonRow = ({ label, renderValue }: { label: string; renderValue: (p: Product) => React.ReactNode }) => (
      <tr className="border-b border-white/5 group hover:bg-white/[0.02] transition-colors">
        <td className="p-8 text-gold font-black uppercase tracking-[0.3em] text-[10px] bg-[#050505] sticky left-0 z-10 w-56 border-r border-gold/10">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-gold/50 rounded-full" />
            {label}
          </div>
        </td>
        {comparedProducts.map((p, i) => (
          <td key={p.id} className={`p-8 ${i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'} min-w-[350px] border-r border-white/5`}>
            {renderValue(p)}
          </td>
        ))}
        {Array.from({ length: 4 - comparedProducts.length }).map((_, i) => (
          <td key={`empty-${i}`} className="p-8 bg-transparent border-r border-white/5 opacity-20">
            <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    );

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#050505] text-white"
      >
        <div className="max-w-[1800px] mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
            <div>
              <button 
                onClick={() => setShowComparison(false)}
                className="flex items-center space-x-3 text-gold hover:text-white transition-all mb-8 group"
              >
                <div className="p-2 rounded-full border border-gold/30 group-hover:border-white transition-colors">
                  <ArrowLeft size={16} />
                </div>
                <span className="uppercase tracking-[0.3em] text-[10px] font-black italic">Volver a la Colección</span>
              </button>

              <div className="relative">
                <span className="text-gold uppercase tracking-[0.5em] text-[10px] mb-4 block font-black opacity-60">Laboratorio de Cata</span>
                <h2 className="text-6xl md:text-8xl font-serif italic mb-6 leading-tight">
                  Mesa de <span className="text-gold">Análisis</span>
                </h2>
                <div className="absolute -left-12 top-0 bottom-0 w-[1px] bg-gradient-to-b from-gold via-gold/10 to-transparent" />
              </div>
              <p className="text-gray-500 max-w-2xl font-serif italic text-xl leading-relaxed">
                Explore las sutilezas técnicas y narrativas que distinguen a estas piezas de colección.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-xl">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-gold font-bold">{compareList.length} / 4 Seleccionados</p>
                <p className="text-[9px] text-white/40 uppercase tracking-widest">Capacidad máxima de análisis</p>
              </div>
              <button 
                onClick={() => setCompareList([])}
                className="p-3 rounded-full hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all border border-white/5"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {comparedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                <Scale size={40} className="text-gold opacity-30" />
              </div>
              <p className="text-gray-500 italic mb-8 max-w-sm">No has seleccionado productos para comparar. Selecciona hasta 4 botellas del catálogo.</p>
              <button 
                onClick={() => setShowComparison(false)}
                className="bg-gold text-black px-12 py-4 rounded-full font-bold uppercase tracking-[0.2em] text-[10px] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all"
              >
                Explorar Colección
              </button>
            </div>
          ) : (
            <>
              <div className="glass rounded-[3rem] border border-white/10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="p-8 bg-[#050505] sticky left-0 z-20 w-56 border-r border-gold/10"></th>
                        {comparedProducts.map((p) => (
                          <th key={p.id} className="p-10 pb-16 text-center bg-white/[0.03] min-w-[350px] relative group border-r border-white/5">
                            <motion.button 
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleCompare(p.id)}
                              className="absolute top-6 right-6 p-2 rounded-full glass border border-white/10 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <X size={18} />
                            </motion.button>
                            
                            <div className="relative mb-10 group-hover:transform group-hover:translate-z-10 transition-transform duration-700">
                              <div className="absolute inset-0 bg-gold/10 blur-3xl rounded-full scale-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent shadow-[0_30px_60px_rgba(0,0,0,0.5)] mx-auto max-w-[220px] relative border border-white/5">
                                <img 
                                  src={p.imageUrl} 
                                  alt={p.name} 
                                  className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700" 
                                  referrerPolicy="no-referrer" 
                                />
                              </div>
                            </div>
                            <h3 className="text-3xl font-serif italic text-gold mb-3 h-20 flex items-center justify-center leading-tight">
                              {p.name}
                            </h3>
                            <p className="text-2xl font-black text-white/80 tracking-tighter">{p.price}</p>
                          </th>
                        ))}
                        {Array.from({ length: 4 - comparedProducts.length }).map((_, i) => (
                          <th key={`empty-${i}`} className="p-10 text-center bg-transparent min-w-[350px] opacity-20 border-r border-white/5">
                            <div className="aspect-[3/4] rounded-3xl border-2 border-dashed border-white/10 mb-12 flex flex-col items-center justify-center mx-auto max-w-[220px] hover:border-gold/30 hover:bg-gold/5 transition-all group/empty">
                              <div className="p-6 rounded-full bg-white/5 mb-4 group-hover/empty:scale-110 transition-transform">
                                <Plus size={32} className="text-white/20 group-hover/empty:text-gold" />
                              </div>
                              <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20">Agregar Elixir</p>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <ComparisonRow 
                        label="Categoría" 
                        renderValue={(p) => (
                          <span className="px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] uppercase font-black tracking-widest inline-block">
                            {p.category}
                          </span>
                        )} 
                      />
                      <ComparisonRow 
                        label="Origen" 
                        renderValue={(p) => (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                              <MapPin size={16} className="text-gold" />
                            </div>
                            <div>
                              <p className="text-white font-serif italic text-lg">{p.origin}</p>
                              <p className="text-[9px] uppercase tracking-widest text-white/30">Terroir Certificado</p>
                            </div>
                          </div>
                        )} 
                      />
                      <ComparisonRow 
                        label="Perfil Sensorial" 
                        renderValue={(p) => (
                          <div className="space-y-4 py-4">
                            {p.flavorProfile ? (
                              <div className="space-y-3">
                                <div className="flex justify-center mb-6">
                                  <FlavorRadar profile={p.flavorProfile} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  {[
                                    { label: 'Dulzor', val: p.flavorProfile.sweetness },
                                    { label: 'Complejidad', val: p.flavorProfile.complexity },
                                    { label: 'Intensidad', val: p.flavorProfile.intensity },
                                    { label: 'Madera', val: p.flavorProfile.oak },
                                    { label: 'Final', val: p.flavorProfile.finish }
                                  ].map(f => (
                                    <div key={f.label} className="bg-white/5 p-3 rounded-xl border border-white/5">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[8px] uppercase tracking-widest text-white/40">{f.label}</span>
                                        <span className="text-[10px] font-bold text-gold">{f.val}%</span>
                                      </div>
                                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${f.val}%` }}
                                          className="h-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-white/30 text-[10px] uppercase font-bold italic animate-pulse">Analizando estructura molecular...</p>
                            )}
                          </div>
                        )} 
                      />
                      <ComparisonRow 
                        label="Notas de Cata" 
                        renderValue={(p) => (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={12} className="text-gold" />
                              <span className="text-[9px] uppercase tracking-widest text-gold font-bold">Impresiones Primarias</span>
                            </div>
                            <p className="text-gray-400 font-serif italic text-lg leading-relaxed">{p.tastingNotes}</p>
                          </div>
                        )} 
                      />
                      <ComparisonRow 
                        label="Narrativa Elite" 
                        renderValue={(p) => (
                          <div className="max-h-[300px] overflow-y-auto scrollbar-hide py-2 pr-4 text-gray-400 font-serif italic text-base leading-relaxed space-y-4">
                            {p.narrative ? (
                              p.narrative.split('\n\n').map((para, i) => <p key={i}>{para}</p>)
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-4 opacity-30">
                                <BookOpen size={32} />
                                <p className="text-[10px] uppercase tracking-widest font-bold">Relato pendiente de generación</p>
                              </div>
                            )}
                          </div>
                        )} 
                      />
                      <ComparisonRow 
                        label="Maridaje Sugerido" 
                        renderValue={(p) => (
                          <div className="flex items-start gap-3 p-4 bg-gold/5 rounded-2xl border border-gold/10">
                            <Heart size={16} className="text-gold mt-1 shrink-0" />
                            <p className="text-white font-serif italic text-base">{p.pairings}</p>
                          </div>
                        )} 
                      />
                      <tr className="border-t border-white/10">
                        <td className="p-8 bg-[#050505] sticky left-0 z-10 w-56 border-r border-gold/10"></td>
                        {comparedProducts.map(p => (
                          <td key={`cta-${p.id}`} className="p-10 text-center bg-white/[0.03] border-r border-white/5">
                            <button 
                              onClick={() => {
                                addToCart(p.id);
                              }}
                              className="bg-gold text-black w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white transition-all shadow-[0_20px_40px_rgba(212,175,55,0.2)] flex items-center justify-center gap-3"
                            >
                              <ShoppingBag size={16} />
                              Adquirir Pieza
                            </button>
                          </td>
                        ))}
                        {Array.from({ length: 4 - comparedProducts.length }).map((_, i) => (
                          <td key={`empty-cta-${i}`} className="p-10 border-r border-white/5"></td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Quick Add Management for comparison */}
              {comparedProducts.length < 4 && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-24"
                >
                  <div className="flex items-center gap-4 mb-12">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-gold/30" />
                    <h3 className="text-gold uppercase tracking-[0.4em] text-xs font-black italic">Sugerencias para Analizar</h3>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-gold/30" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {products
                      .filter(p => !compareList.includes(p.id))
                      .slice(0, 6)
                      .map(p => (
                        <motion.div 
                          key={p.id}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => toggleCompare(p.id)}
                          className="glass p-4 rounded-3xl border border-white/5 cursor-pointer hover:border-gold/30 transition-all group"
                        >
                          <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-white/5 border border-white/10 p-4">
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain filter group-hover:brightness-110" />
                          </div>
                          <h4 className="text-white font-serif italic text-xs mb-1 truncate">{p.name}</h4>
                          <p className="text-gold font-bold text-[10px] tracking-widest">{p.price}</p>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen font-sans selection:bg-gold selection:text-black pb-20 md:pb-0">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'glass py-3 shadow-2xl bg-black/70' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-serif italic tracking-tighter holographic-text cursor-pointer"
            whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            TAMBAR
          </motion.h1>
          
          <div className="hidden md:flex space-x-8 text-xs uppercase tracking-widest font-medium">
            <a href="#collection" className="hover:text-gold transition-colors">Colección</a>
            <a href="#exclusive" className="hover:text-gold transition-colors">Exclusivos</a>
            <a href="#stores" className="hover:text-gold transition-colors">Boutiques</a>
            <a href="#sommelier" className="hover:text-gold transition-colors">Sommelier AI</a>
          </div>

          <div className="flex items-center space-x-4">
            {compareList.length > 0 && (
              <Tooltip text="Visualizar la comparativa entre sus elixires seleccionados">
                <button 
                  onClick={() => setShowComparison(true)}
                  className="relative glass p-2 rounded-full text-gold hover:text-white transition-colors border border-gold/30"
                >
                  <Scale size={20} />
                  <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {compareList.length}
                  </span>
                </button>
              </Tooltip>
            )}
            <Tooltip text="Acceder a su bolsa de compras exclusiva">
              <button 
                className="relative glass p-2 rounded-full text-white hover:text-gold transition-colors border border-white/10"
              >
                <ShoppingBag size={20} />
                {cart.reduce((acc, item) => acc + item.quantity, 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </button>
            </Tooltip>
            <Tooltip text="Consultar su cava de deseos y favoritos">
              <button 
                className="relative glass p-2 rounded-full text-white hover:text-red-500 transition-colors border border-white/10"
              >
                <Heart size={20} fill={wishlist.length > 0 ? "currentColor" : "none"} className={wishlist.length > 0 ? "text-red-500" : ""} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>
            </Tooltip>
            <button className="bg-gold text-black px-6 py-2 rounded-full text-xs font-bold uppercase tracking-tighter hover:bg-white transition-all">
              Contacto
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section 2026 */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          {isGeneratingHero ? (
            <div className="w-full h-full bg-[#050505] flex items-center justify-center">
              <div className="space-y-4 text-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-t-2 border-gold rounded-full mx-auto"
                />
                <p className="text-gold tracking-[0.5em] text-[10px] uppercase font-black animate-pulse">GENERATING PRESTIGIOUS ATMOSPHERE...</p>
              </div>
            </div>
          ) : (
            <>
              <img 
                src={heroImage || "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop"} 
                alt="TAMBAR Luxury Cellar" 
                className="w-full h-full object-cover opacity-30 scale-105 filter contrast-125 brightness-75"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/40 to-[#050505]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent_70%)]"></div>
            </>
          )}
        </motion.div>

        <div className="relative z-10 text-center px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span 
              initial={{ letterSpacing: "1em", opacity: 0 }}
              animate={{ letterSpacing: "0.5em", opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="text-gold uppercase text-[10px] sm:text-xs mb-8 block font-bold"
            >
              Excelecia en Cada Gota • Est. 2026
            </motion.span>
            
            <h1 className="text-7xl sm:text-9xl md:text-[10rem] font-serif mb-10 leading-[0.85] tracking-tighter">
              <span className="block italic font-light text-white/90">Pure</span>
              <span className="block holographic-text italic">Bespoke</span>
              <span className="block text-luxury">Elite.</span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1 }}
              className="text-gray-300 max-w-xl mx-auto text-sm uppercase tracking-[0.4em] font-light mb-12"
            >
              Curaduría Exclusiva de Espirituosos de Clase Mundial
            </motion.p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16">
              <motion.a 
                href="#collection"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-10 py-5 bg-gold text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-full overflow-hidden transition-all hover:bg-white shadow-[0_0_50px_rgba(212,175,55,0.4)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                Explore La Colección
              </motion.a>
              
              <motion.a 
                href="#sommelier"
                whileHover={{ y: -2 }}
                className="flex items-center gap-3 text-gold border-b border-gold/30 pb-2 uppercase tracking-[0.3em] text-[10px] font-bold hover:border-gold transition-all"
              >
                <Sparkles size={14} />
                AI Experience
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute bottom-12 left-12 hidden lg:block">
          <div className="flex items-center gap-4">
            <div className="w-12 h-px bg-gold/50"></div>
            <span className="text-[10px] text-gold uppercase tracking-[0.4em] font-bold">Santa Cruz — Bolivia</span>
          </div>
        </div>

        {/* Hero Image Controls Improvements */}
        <div className="absolute bottom-8 right-8 z-30 glass p-4 rounded-xl flex items-end space-x-4 border border-white/10 opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex flex-col">
            <label className="text-[8px] uppercase tracking-widest text-gold mb-1 font-bold">AI Studio Format</label>
            <select 
              value={heroAspectRatio}
              onChange={(e) => setHeroAspectRatio(e.target.value)}
              disabled={isGeneratingHero}
              className="bg-black/50 border border-white/10 text-white text-[10px] rounded px-3 py-1 focus:outline-none focus:border-gold transition-colors disabled:opacity-50"
            >
              <option value="1:1">1:1 Square</option>
              <option value="16:9">16:9 Cinema</option>
              <option value="21:9">21:9 UltraWide</option>
            </select>
          </div>
          <button
            onClick={() => {
              setIsGeneratingHero(true);
              generateHeroImage(heroAspectRatio).then(url => {
                setHeroImage(url);
                setIsGeneratingHero(false);
              });
            }}
            disabled={isGeneratingHero}
            className="bg-gold/20 text-gold border border-gold/30 px-4 py-[6px] rounded text-[10px] font-bold uppercase tracking-tighter hover:bg-gold hover:text-black transition-all disabled:opacity-50"
          >
            {isGeneratingHero ? "..." : "Refrescar"}
          </button>
        </div>
      </section>

      {/* Collection Section */}
      <section id="collection" className="py-32 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <div>
              <span className="text-gold uppercase tracking-widest text-xs mb-4 block">Nuestra Selección</span>
              <h3 className="text-5xl font-serif italic">Catálogo de Élite</h3>
            </div>
            <p className="text-gray-500 max-w-md text-sm leading-relaxed">
              Cada botella en nuestra colección ha sido seleccionada por su herencia, complejidad y carácter excepcional.
            </p>
          </div>

          {/* Filters and Sorting */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6 border-y border-white/5 py-8">
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 border ${
                    selectedCategory === cat 
                      ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                      : 'text-gray-500 border-white/10 hover:border-gold/50 hover:text-gold'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative group">
              <div className="flex items-center space-x-3 text-gold bg-white/5 px-6 py-3 rounded-full border border-white/10 group-hover:border-gold/30 transition-all cursor-pointer">
                <Filter size={14} />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-[10px] uppercase tracking-widest font-bold outline-none cursor-pointer appearance-none pr-6"
                >
                  <option value="default" className="bg-[#111]">Ordenar por</option>
                  <option value="name-asc" className="bg-[#111]">Nombre (A-Z)</option>
                  <option value="name-desc" className="bg-[#111]">Nombre (Z-A)</option>
                  <option value="price-asc" className="bg-[#111]">Precio (Menor a Mayor)</option>
                  <option value="price-desc" className="bg-[#111]">Precio (Mayor a Menor)</option>
                </select>
                <ChevronDown size={14} className="absolute right-6 pointer-events-none" />
              </div>
            </div>
          </div>

          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <AnimatePresence mode='popLayout'>
              {paginatedProducts.map((product, index) => (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                >
                  <ProductCard 
                    product={product} 
                    index={index} 
                    onCompare={toggleCompare}
                    onWishlist={toggleWishlist}
                    onAddToCart={addToCart}
                    isComparing={compareList.includes(product.id)}
                    isWishlisted={wishlist.includes(product.id)}
                    onClick={() => {
                      setSelectedProduct(product);
                      if (!viewedProducts.includes(product.id)) {
                        setViewedProducts(prev => [...prev, product.id]);
                      }
                    }}
                    onImageGenerated={handleImageGenerated}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          
          {totalPages > 1 && (
            <div className="mt-20 flex justify-center items-center space-x-4">
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="glass p-4 rounded-full text-gold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold hover:text-black transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentPage(i + 1);
                      document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${
                      currentPage === i + 1 ? 'bg-gold text-black' : 'glass text-gray-400 hover:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="glass p-4 rounded-full text-gold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold hover:text-black transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          
          {filteredAndSortedProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 italic">No se encontraron productos en esta categoría.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recommended For You Section */}
      {viewedProducts.length > 0 && (
        <section className="py-20 px-6 bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <span className="text-gold uppercase tracking-widest text-xs mb-2 block">Personalizado</span>
                <h2 className="text-4xl font-serif italic">Recomendado para ti</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products
                .filter(p => !viewedProducts.includes(p.id))
                .filter(p => {
                  const viewedCategories = products.filter(vp => viewedProducts.includes(vp.id)).map(vp => vp.category);
                  return viewedCategories.includes(p.category);
                })
                .slice(0, 4)
                .map((product, index) => (
                  <motion.div
                    key={`rec-${product.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group cursor-pointer"
                    onClick={() => {
                      setSelectedProduct(product);
                      if (!viewedProducts.includes(product.id)) {
                        setViewedProducts(prev => [...prev, product.id]);
                      }
                    }}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl mb-6 bg-white/5">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="absolute bottom-0 left-0 w-full p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        <button className="w-full glass py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition-colors">
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <span className="text-gold text-[10px] uppercase tracking-[0.2em] mb-2 block">{product.category}</span>
                      <h3 className="font-serif text-xl italic mb-2">{product.name}</h3>
                      <p className="text-gray-400 font-light">{product.price}</p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Viewed Section */}
      {viewedProducts.length > 0 && (
        <section className="py-20 px-6 bg-black">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <span className="text-gold uppercase tracking-widest text-xs mb-2 block">Historial</span>
                <h2 className="text-4xl font-serif italic">Vistos recientemente</h2>
              </div>
              <button 
                onClick={() => setViewedProducts([])}
                className="text-gray-500 hover:text-gold transition-colors text-xs uppercase tracking-widest"
              >
                Limpiar historial
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {viewedProducts.slice().reverse().map((id, index) => {
                const product = products.find(p => p.id === id);
                if (!product) return null;
                return (
                  <motion.div
                    key={`recent-${id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-xl mb-4 bg-white/5">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h4 className="text-xs font-serif italic text-gold truncate">{product.name}</h4>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Exclusive Section */}
      <section id="exclusive" className="py-32 px-6 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.2),transparent_70%)]" />
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <span className="text-gold uppercase tracking-[0.3em] text-xs mb-4 block font-bold">Ediciones Limitadas</span>
              <h3 className="text-6xl font-serif italic mb-6">La Bóveda de <span className="text-gold">Exclusivos</span></h3>
              <p className="text-gray-400 text-lg font-light leading-relaxed">
                Piezas únicas de coleccionista, whiskies de destilerías desaparecidas y ediciones numeradas que representan el pináculo del arte de la destilación.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="glass p-6 rounded-2xl border border-gold/20 text-center min-w-[140px]">
                <span className="text-3xl font-serif italic text-gold block mb-1">12</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Botellas Únicas</span>
              </div>
              <div className="glass p-6 rounded-2xl border border-gold/20 text-center min-w-[140px]">
                <span className="text-3xl font-serif italic text-gold block mb-1">100%</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Autenticidad</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {products.filter(p => p.isExclusive).map((product, idx) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                index={idx}
                onCompare={toggleCompare}
                onWishlist={toggleWishlist}
                onAddToCart={addToCart}
                isComparing={compareList.includes(product.id)}
                isWishlisted={wishlist.includes(product.id)}
                onClick={() => setSelectedProduct(product)}
                onImageGenerated={handleImageGenerated}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Store Locator Section */}
      <section id="stores" className="py-32 px-6 bg-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.1),transparent_70%)]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-12 bg-gold/50"></div>
              <span className="text-gold uppercase tracking-[0.4em] text-[10px] font-black">PRESENCIA EXCLUSIVA</span>
              <div className="h-px w-12 bg-gold/50"></div>
            </div>
            <h3 className="text-6xl font-serif italic mb-6">Boutiques de <span className="holographic-text">Élite</span></h3>
            <p className="text-gray-400 max-w-xl mx-auto font-light text-base leading-relaxed">
              Explore los santuarios del buen beber. Ubicaciones seleccionadas que personifican la filosofía TAMBAR.
            </p>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border border-white/10 max-w-4xl mx-auto shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={20} />
                <input 
                  type="text" 
                  value={storeQuery}
                  onChange={(e) => setStoreQuery(e.target.value)}
                  placeholder="Ciudad, zona o código postal..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold transition-all"
                />
              </div>
              <button 
                onClick={async () => {
                  setIsSearchingStores(true);
                  let lat, lng;
                  try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                  } catch (e) {
                    console.warn("Geolocation failed or denied, using query only.");
                  }
                  const results = await getStoreLocations(storeQuery, lat, lng);
                  setStoreResults(results);
                  setIsSearchingStores(false);
                }}
                disabled={isSearchingStores || !storeQuery}
                className="bg-gold text-black px-8 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSearchingStores ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Navigation size={18} />
                    <span>Buscar</span>
                  </>
                )}
              </button>
            </div>

            {storeResults && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed italic">{storeResults.text}</p>
                </div>
                
                {storeResults.grounding && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    {storeResults.grounding.map((chunk: any, idx: number) => (
                      chunk.maps && (
                        <a 
                          key={idx}
                          href={chunk.maps.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass p-4 rounded-2xl border border-white/5 hover:border-gold/30 transition-all group flex items-center justify-between"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-black transition-all">
                                <MapPin size={18} />
                              </div>
                              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{chunk.maps.title || "Ver en Google Maps"}</span>
                            </div>
                            {chunk.maps.placeAnswerSources?.reviewSnippets && (
                              <div className="mt-2 pl-12">
                                {chunk.maps.placeAnswerSources.reviewSnippets.map((snippet: string, sIdx: number) => (
                                  <p key={sIdx} className="text-[10px] text-gray-500 italic line-clamp-1">"{snippet}"</p>
                                ))}
                              </div>
                            )}
                          </div>
                          <ArrowRight size={16} className="text-gold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </a>
                      )
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* AI Sommelier Feature */}
      <section id="sommelier" className="py-32 px-6 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gold/5 blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="z-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-gold/50"></div>
              <span className="text-gold uppercase tracking-[0.5em] text-[10px] font-black">AI SOMMELIER EXPERTISE</span>
            </div>
            <h3 className="text-6xl font-serif italic mb-8 leading-[1.1] text-white">
              Sinfonía de <br /> 
              <span className="holographic-text">Sabores</span> & <span className="text-gold">Saber</span>
            </h3>
            <p className="text-gray-400 text-lg font-light leading-relaxed mb-12 max-w-lg">
              Deje que nuestra Inteligencia Sommelier, inspirada en las bodegas más insignes del mundo, descubra el maridaje perfecto para su paladar exigente.
            </p>
            <button 
              onClick={() => setIsChatOpen(true)}
              className="group relative bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-[0.2em] text-xs hover:bg-gold transition-all flex items-center space-x-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gold translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
              <MessageSquare size={18} className="relative z-10" />
              <span className="relative z-10">Iniciar Ritual de Consulta</span>
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-square rounded-3xl overflow-hidden glass p-1 group"
          >
            {sommelierImage ? (
              <img 
                src={sommelierImage} 
                alt="Expert AI Sommelier" 
                className="w-full h-full object-cover rounded-[22px] group-hover:scale-105 transition-transform duration-[2000ms]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black/40">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-t-2 border-gold rounded-full"
                />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="glass p-10 rounded-2xl max-w-sm text-center border border-gold/30 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                <Sparkles className="text-gold mx-auto mb-6" size={40} />
                <p className="italic font-serif text-2xl leading-relaxed text-white">
                  "Un buen whisky no solo se bebe, se experimenta."
                </p>
                <div className="h-0.5 w-12 bg-gold mx-auto mt-6"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Location Section */}
      <section id="location" className="py-32 px-6 bg-[#050505] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-gold uppercase tracking-widest text-xs mb-4 block flex items-center gap-2">
                <MapPin size={14} />
                Nuestra Ubicación
              </span>
              <h3 className="text-4xl md:text-5xl font-serif italic mb-8 leading-tight">
                Visite nuestro <br /> <span className="text-gold">Santuario</span>
              </h3>
              <p className="text-gray-400 text-lg font-light leading-relaxed mb-8">
                Descubra nuestra colección exclusiva en persona. Nuestro equipo de expertos estará encantado de guiarle a través de una experiencia de cata inolvidable en el corazón de Santa Cruz de la Sierra.
              </p>
              
              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full glass flex items-center justify-center shrink-0 text-gold">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h5 className="text-white font-bold mb-1">Dirección</h5>
                    <p className="text-gray-400 text-sm">Santa Cruz de la Sierra, Bolivia</p>
                  </div>
                </div>
              </div>

              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=-17.75174724227906,-63.21724037843324"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gold text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)]"
              >
                <Navigation size={16} />
                <span>Cómo Llegar</span>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden glass p-2 shadow-2xl"
            >
              <div className="w-full h-full rounded-[20px] overflow-hidden relative">
                <iframe 
                  src="https://maps.google.com/maps?q=-17.75174724227906,-63.21724037843324&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(100%)' }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="TAMBAR Location"
                  className="absolute inset-0"
                ></iframe>
                {/* Overlay to give it a darker, more premium look matching the site */}
                <div className="absolute inset-0 pointer-events-none bg-black/20 mix-blend-multiply"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-4xl font-serif italic tracking-tighter holographic-text mb-8">TAMBAR</h4>
            <p className="text-gray-500 max-w-sm font-light leading-relaxed">
              Dedicados a la excelencia en el mundo de los destilados. Una experiencia de lujo curada para los conocedores más exigentes del mundo.
            </p>
          </div>
          
          <div>
            <h5 className="text-xs uppercase tracking-widest font-bold mb-6">Navegación</h5>
            <ul className="space-y-4 text-sm text-gray-500 font-light">
              <li><a href="#" className="hover:text-gold transition-colors">Colección</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Exclusivos</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Historia</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs uppercase tracking-widest font-bold mb-6">Síguenos</h5>
            <div className="flex space-x-6 text-gray-500">
              <a href="https://instagram.com/tambarluxury" target="_blank" rel="noopener noreferrer" title="Instagram" className="hover:text-gold transition-colors"><Instagram size={20} /></a>
              <a href="https://facebook.com/tambarluxury" target="_blank" rel="noopener noreferrer" title="Facebook" className="hover:text-gold transition-colors"><Facebook size={20} /></a>
              <a href="https://twitter.com/tambarluxury" target="_blank" rel="noopener noreferrer" title="Twitter" className="hover:text-gold transition-colors"><Twitter size={20} /></a>
              <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="hover:text-gold transition-colors"><MessageCircle size={20} /></a>
              <a href="https://t.me/tambarluxury" target="_blank" rel="noopener noreferrer" title="Telegram" className="hover:text-gold transition-colors"><Send size={20} /></a>
              <a href="https://tiktok.com/@tambarluxury" target="_blank" rel="noopener noreferrer" title="TikTok" className="hover:text-gold transition-colors"><Music size={20} /></a>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-widest text-gray-600">
          <p>© 2026 TAMBAR — Experiencia de lujo. Todos los derechos reservados.</p>
          <div className="flex space-x-8">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <span className="text-gray-800">DIHACKTOR AGENTE SUPREMO</span>
          </div>
        </div>
      </footer>

      {/* Comparison Floating Button */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 z-[150]"
          >
            <button 
              onClick={() => setShowComparison(true)}
              className="bg-gold text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(212,175,55,0.4)] flex items-center space-x-3 hover:bg-white transition-all group"
            >
              <Scale size={16} className="group-hover:rotate-12 transition-transform" />
              <span>Comparar Seleccionados ({compareList.length})</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl bg-[#0a0a0a] rounded-[2rem] overflow-y-auto overflow-x-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              <div className="w-full md:w-1/2 h-64 md:h-[90vh] sticky top-0 bg-white/5 group z-40">
                {/* Close button inside sticky container so it stays visible */}
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-6 right-6 md:right-auto md:left-6 z-50 glass p-3 rounded-full text-white/50 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>

                {productGallery.length > 0 ? (
                  <div className="relative w-full h-full overflow-hidden">
                    <AnimatePresence initial={false} custom={direction}>
                      <motion.div
                        key={currentGalleryIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          x: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                          const swipe = swipePower(offset.x, velocity.x);

                          if (swipe < -swipeConfidenceThreshold) {
                            paginate(1);
                          } else if (swipe > swipeConfidenceThreshold) {
                            paginate(-1);
                          }
                        }}
                        className="absolute w-full h-full cursor-grab active:cursor-grabbing"
                      >
                        <ZoomableImage 
                          src={productGallery[currentGalleryIndex]} 
                          alt={`${selectedProduct.name} - Imagen ${currentGalleryIndex + 1}`} 
                        />
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* Navigation Arrows */}
                    {productGallery.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            paginate(-1);
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 glass p-3 rounded-full text-white/70 hover:text-white hover:bg-gold hover:text-black opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            paginate(1);
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 glass p-3 rounded-full text-white/70 hover:text-white hover:bg-gold hover:text-black opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}

                    {/* Gallery Indicators */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                      {productGallery.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentGalleryIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${idx === currentGalleryIndex ? 'bg-gold w-4' : 'bg-white/50 hover:bg-white/80'}`}
                        />
                      ))}
                    </div>

                    {/* Thumbnail Strip (Desktop) */}
                    <div className="absolute bottom-12 left-6 right-6 hidden md:flex justify-center space-x-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {productGallery.map((img, idx) => (
                        <button
                          key={`thumb-${idx}`}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const newDir = idx > currentGalleryIndex ? 1 : -1;
                            setDirection(newDir);
                            setCurrentGalleryIndex(idx); 
                          }}
                          className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === currentGalleryIndex ? 'border-gold scale-110 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-white/10 opacity-50 hover:opacity-100 hover:scale-105'}`}
                        >
                          <img src={img} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <img 
                    src={selectedProduct.imageUrl} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                
                {isGeneratingGallery && (
                  <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full flex items-center space-x-2 z-20">
                    <div className="w-3 h-3 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] uppercase tracking-widest text-gold font-bold">Generando Galería...</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent md:bg-gradient-to-r pointer-events-none z-10" />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-12">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-gold/10 text-gold px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border border-gold/20">
                        {selectedProduct.category}
                      </span>
                      {selectedProduct.isExclusive && (
                        <span className="bg-white/10 text-white px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border border-white/20 flex items-center gap-1">
                          <Sparkles size={10} className="text-gold" />
                          Edición 2026
                        </span>
                      )}
                    </div>
                    <h2 className="text-5xl md:text-6xl font-serif italic mb-2 leading-tight">
                      {selectedProduct.name}
                    </h2>
                    <p className="text-gold text-2xl font-serif">{selectedProduct.price}</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => toggleCompare(selectedProduct.id)}
                      className={`p-4 rounded-full transition-all border ${
                        compareList.includes(selectedProduct.id) 
                          ? 'bg-gold border-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' 
                          : 'bg-white/5 border-white/10 text-white hover:border-gold'
                      }`}
                      title="Comparar"
                    >
                      <Scale size={20} />
                    </button>
                    <button className="bg-gold text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white transition-all">
                      Adquirir Ahora
                    </button>
                  </div>
                </div>

                {/* Flavor Signature Integration */}
                <div className="mb-12 glass-dark p-8 rounded-3xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold italic">Análisis Sommelier AI 2026</h4>
                    <p className="text-white/80 font-light leading-relaxed mb-4">
                      Nuestro algoritmo ha procesado las notas de cata para generar una firma sensorial única para este ejemplar.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedProduct.tastingNotes.split(',').map((note, i) => (
                        <span key={i} className="text-[9px] uppercase tracking-widest bg-white/5 px-2 py-1 rounded text-gray-400">
                          {note.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <FlavorRadar profile={selectedProduct.flavorProfile} />
                </div>

                {selectedProduct.narrative && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 relative"
                  >
                    <div className="absolute -left-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-gold via-gold/20 to-transparent" />
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center border border-gold/30">
                        <Sparkles size={14} className="text-gold" />
                      </div>
                      <h4 className="text-[10px] uppercase tracking-[0.4em] text-gold font-black">Sommelier's Elite Narrative</h4>
                    </div>
                    <div className="space-y-6 text-white/90 font-serif italic text-lg leading-relaxed md:pr-12">
                      {selectedProduct.narrative.split('\n\n').map((para, i) => {
                        const trimmedPara = para.trim();
                        if (!trimmedPara) return null;
                        return (
                          <p key={i} className="relative">
                            <span className="first-letter:text-4xl first-letter:float-left first-letter:mr-3 first-letter:text-gold first-letter:font-black first-letter:mt-1">
                              {trimmedPara}
                            </span>
                          </p>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                <div className="space-y-12">
                  <div className="relative">
                    <div className="absolute -left-4 top-0 w-1 h-full bg-gold/50 rounded-full" />
                    <h5 className="text-[10px] uppercase tracking-widest text-gold mb-3 font-bold flex items-center gap-2">
                       <BookOpen size={12} />
                       Historia y Herencia
                    </h5>
                    <p className="text-gray-400 text-base leading-relaxed font-light italic">
                      "{selectedProduct.description}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-gold/30 transition-all flex flex-col items-center text-center group/item">
                      <div className="w-12 h-12 rounded-full glass flex items-center justify-center text-gold mb-4 group-hover/item:bg-gold group-hover/item:text-black transition-all">
                        <MapPin size={20} />
                      </div>
                      <h5 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Origen</h5>
                      <p className="text-sm text-white font-serif italic">{selectedProduct.origin}</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-gold/30 transition-all flex flex-col items-center text-center group/item">
                      <div className="w-12 h-12 rounded-full glass flex items-center justify-center text-gold mb-4 group-hover/item:bg-gold group-hover/item:text-black transition-all">
                        <Wine size={20} />
                      </div>
                      <h5 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Notas de Cata</h5>
                      <p className="text-sm text-white font-serif italic line-clamp-3">{selectedProduct.tastingNotes}</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-gold/30 transition-all flex flex-col items-center text-center group/item">
                      <div className="w-12 h-12 rounded-full glass flex items-center justify-center text-gold mb-4 group-hover/item:bg-gold group-hover/item:text-black transition-all">
                        <ShoppingBag size={20} />
                      </div>
                      <h5 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Maridaje</h5>
                      <p className="text-sm text-white font-serif italic">{selectedProduct.pairings}</p>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-white/5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Tooltip text="Añadir esta pieza única a su colección privada">
                        <button 
                          onClick={() => addToCart(selectedProduct.id)}
                          className="flex-[2] bg-gold text-black py-5 rounded-full font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white transition-all shadow-[0_20px_40px_rgba(212,175,55,0.2)] flex items-center justify-center gap-3"
                        >
                          <ShoppingBag size={16} />
                          Añadir al Carrito de Élite
                        </button>
                      </Tooltip>
                      <Tooltip text={wishlist.includes(selectedProduct.id) ? "Retirar de su selección de favoritos" : "Añadir a su cava exclusiva de deseos"}>
                        <button 
                          onClick={() => toggleWishlist(selectedProduct.id)}
                          className={`flex-1 glass py-5 rounded-full font-bold uppercase tracking-widest text-[10px] transition-all border flex items-center justify-center gap-2 ${
                            wishlist.includes(selectedProduct.id) ? 'border-red-500/50 text-red-500' : 'border-white/10 text-white hover:border-red-500/50'
                          }`}
                        >
                          <Heart size={16} fill={wishlist.includes(selectedProduct.id) ? "currentColor" : "none"} />
                          {wishlist.includes(selectedProduct.id) ? 'En Favoritos' : 'Añadir a Deseos'}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Comparison Bar */}
      <AnimatePresence>
        {compareList.length > 0 && !showComparison && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] glass px-8 py-4 rounded-full border border-gold/30 shadow-[0_0_30px_rgba(212,175,55,0.2)] flex items-center space-x-8"
          >
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-3">
                {compareList.slice(0, 3).map(id => {
                  const p = products.find(prod => prod.id === id);
                  return (
                    <div key={id} className="w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-white/5">
                      <img src={p?.imageUrl} alt={p?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  );
                })}
                {compareList.length > 3 && (
                  <div className="w-10 h-10 rounded-full border-2 border-black bg-gold text-black flex items-center justify-center text-[10px] font-bold">
                    +{compareList.length - 3}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-gold font-bold">Comparativa</span>
                <span className="text-xs text-white">{compareList.length} productos seleccionados</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCompareList([])}
                className="text-gray-400 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold"
              >
                Limpiar
              </button>
              <button 
                onClick={() => setShowComparison(true)}
                className="bg-gold text-black px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-white transition-all"
              >
                Comparar Ahora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Interface */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 right-6 w-full max-w-md z-[100] glass rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]"
          >
            <div className="bg-gold p-6 flex justify-between items-center holographic-border rounded-t-3xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-gold shadow-[0_0_15px_rgba(212,175,55,0.5)]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-black font-bold text-sm">Sommelier AI v3.1</h4>
                  <p className="text-black/60 text-[10px] uppercase tracking-widest font-black">Elite Intelligence</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setChatHistory([])}
                  className="text-black/50 hover:text-black transition-colors p-2"
                  title="Limpiar chat"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="text-black/50 hover:text-black transition-colors p-2"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-black/20 to-transparent">
              {chatHistory.length === 0 && (
                <div className="text-center py-10 flex flex-col items-center justify-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-gold/5 flex items-center justify-center border border-gold/10">
                    <Wine className="text-gold/20" size={40} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm italic mb-2">"Bienvenido a TAMBAR. ¿En qué puedo asistirle hoy?"</p>
                    <p className="text-gold/40 text-[10px] uppercase tracking-widest font-bold">Consulte sobre maridajes, origen o exclusivas</p>
                  </div>
                  <button 
                    onClick={handleDeepDive}
                    className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gold px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-colors"
                  >
                    <BookOpen size={14} />
                    <span>Inmersión Histórica</span>
                  </button>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-xl ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-gold to-[#b8860b] text-black rounded-tr-sm font-medium' 
                      : 'glass-dark text-gray-200 rounded-tl-sm border border-white/5'
                  }`}>
                    {msg.parts.map((part, pi) => (
                      <div key={pi} className="space-y-3">
                        {part.text && <p className="whitespace-pre-wrap">{part.text}</p>}
                        {part.inlineData && (
                          <div className="relative group">
                            <img 
                              src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                              alt="Uploaded content" 
                              className="mt-2 rounded-2xl max-w-full h-auto border border-white/10 shadow-lg group-hover:scale-[1.02] transition-transform duration-500"
                            />
                            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="glass-dark p-6 rounded-3xl rounded-tl-sm border border-gold/20 shadow-[0_0_30px_rgba(212,175,55,0.1)] flex flex-col space-y-4 min-w-[200px]">
                    <div className="flex items-center space-x-3 text-[10px] uppercase tracking-widest text-gold font-bold">
                      <div className="relative">
                        <Sparkles size={14} className="animate-spin duration-[3000ms]" />
                        <motion.div 
                          className="absolute inset-0 bg-gold/50 blur-sm rounded-full"
                          animate={{ opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <span className="animate-pulse">Sommelier Pensando...</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0.3 }}
                        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-2 h-2 bg-gold rounded-full" 
                      />
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0.3 }}
                        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="w-2 h-2 bg-gold rounded-full" 
                      />
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0.3 }}
                        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                        className="w-2 h-2 bg-gold rounded-full" 
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 italic font-light">Accediendo a bibliotecas de destilados...</p>
                  </div>
                </div>
              )}

              {suggestions.length > 0 && !isTyping && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(suggestion, null)}
                      className="bg-white/5 border border-white/10 hover:border-gold/50 hover:bg-gold/5 text-gray-300 hover:text-gold px-4 py-2 rounded-full text-xs transition-all text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 glass border-t border-white/10">
              {selectedImage && (
                <div className="mb-4 relative inline-block">
                  <img src={selectedImage} alt="Selected" className="w-20 h-20 object-cover rounded-xl border border-gold/30" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                <input 
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 rounded-full transition-all ${selectedImage ? 'text-gold bg-gold/10' : 'text-gray-500 hover:text-gold hover:bg-white/5'}`}
                  title="Subir foto para análisis"
                >
                  <Camera size={20} />
                </button>
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={selectedImage ? "Describe qué quieres saber de la imagen..." : "Pregunte sobre un whisky..."}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3 text-sm focus:outline-none focus:border-gold transition-colors"
                />
                <button 
                  type="submit"
                  disabled={isTyping || (!chatMessage.trim() && !selectedImage)}
                  className="bg-gold text-black p-3 rounded-full hover:scale-110 transition-transform disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden glass bg-black/80 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex justify-around items-center h-20 px-4">
          <a 
            href="#home" 
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gold transition-colors"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <Home size={20} />
            <span className="text-[9px] uppercase tracking-widest font-bold">Inicio</span>
          </a>
          <a 
            href="#collection" 
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gold transition-colors"
          >
            <Wine size={20} />
            <span className="text-[9px] uppercase tracking-widest font-bold">Colección</span>
          </a>
          <a 
            href="#stores" 
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gold transition-colors"
          >
            <MapPin size={20} />
            <span className="text-[9px] uppercase tracking-widest font-bold">Boutiques</span>
          </a>
          <Tooltip text="Convocar al Sommelier AI para asesoría de élite">
            <button 
              onClick={() => setIsChatOpen(true)}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-gold transition-colors"
            >
              <div className="relative">
                <Sparkles size={20} />
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full blur-[2px]"
                />
              </div>
              <span className="text-[9px] uppercase tracking-widest font-bold">Sommelier</span>
            </button>
          </Tooltip>
        </div>
      </nav>
    </div>
  );
}
