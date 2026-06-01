export default function Footer() {
  return (
    <footer className="bg-agave text-white/80 py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <p className="italic font-serif text-arena mb-2">
          "Dios hace florecer el desierto. Isaías 35:1"
        </p>
        <p className="text-sm">
          Florece - Cactus y Suculentas • Guatemala
        </p>
        <p className="text-xs mt-4">
          © {new Date().getFullYear()} Todos los derechos reservados
        </p>
      </div>
    </footer>
  )
}
