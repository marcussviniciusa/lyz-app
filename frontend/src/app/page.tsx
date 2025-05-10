'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, CircleCheck, FileText, FlaskRound, LineChart, UserCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header/Navigation */}
      <header className="py-6 px-4 md:px-8 lg:px-16 flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">L</div>
            <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-transparent bg-clip-text">Lyz</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-700 hover:text-emerald-600 transition">Recursos</a>
          <a href="#how-it-works" className="text-gray-700 hover:text-emerald-600 transition">Como Funciona</a>
          <Link href="/auth/login" className="text-gray-700 hover:text-emerald-600 transition">Entrar</Link>
          <Link 
            href="/auth/register" 
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm"
          >
            Começar Agora
          </Link>
        </nav>
        <div className="md:hidden">
          <button className="text-gray-700 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 md:px-8 lg:px-16 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 md:pr-8 mb-8 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-4">
            <span className="block">Planos Personalizados de</span>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 text-transparent bg-clip-text">Ciclicidade Feminina</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Lyz é a primeira assistente especializada em criar planos personalizados baseados na ciclicidade feminina, auxiliando profissionais de saúde a fornecerem recomendações precisas e eficazes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/auth/register" 
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition shadow-md text-center font-medium"
            >
              Criar Conta Grátis
            </Link>
            <Link 
              href="/dashboard" 
              className="border border-emerald-600 text-emerald-600 px-6 py-3 rounded-lg hover:bg-emerald-50 transition text-center font-medium"
            >
              Acessar Dashboard
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative h-[400px] w-full max-w-[500px] rounded-lg overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/80 to-teal-500/80 flex items-center justify-center">
              <div className="text-center text-white p-4">
                <p className="text-lg font-medium">Imagem ilustrativa</p>
                <p className="text-sm">Aqui entraria uma representação visual da interface ou do ciclo feminino</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Health Professionals */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Desenvolvido para Profissionais de Saúde</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            Ofereça atendimento personalizado baseado na ciclicidade feminina com o apoio da inteligência artificial.
          </p>
          
          <div id="features" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCircle className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Planos Personalizados</h3>
              <p className="text-gray-600">
                Crie planos específicos respeitando as diferentes fases do ciclo menstrual, garantindo uma abordagem verdadeiramente personalizada.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Análise de Exames</h3>
              <p className="text-gray-600">
                Faça upload de exames laboratoriais para análise automática e integração com as recomendações para cada fase do ciclo.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FlaskRound className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Matriz IFM</h3>
              <p className="text-gray-600">
                Preencha a matriz do Instituto de Medicina Funcional de forma assistida, integrando dados da paciente automaticamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center">Como Funciona</h2>
          <p className="text-lg text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Um processo simples e eficiente para criar planos cíclicos personalizados para suas pacientes.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm h-full">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">1</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">Cadastro de Dados</h3>
                <p className="text-gray-600">
                  Insira os dados da paciente e informações relevantes sobre seu ciclo e saúde.
                </p>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ChevronRight size={24} className="text-emerald-600" />
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm h-full">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">2</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">Análise de Exames</h3>
                <p className="text-gray-600">
                  Upload e análise de exames laboratoriais para entendimento completo da saúde da paciente.
                </p>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ChevronRight size={24} className="text-emerald-600" />
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm h-full">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">3</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">Geração do Plano</h3>
                <p className="text-gray-600">
                  A IA processa todas as informações e cria um plano personalizado para cada fase do ciclo.
                </p>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ChevronRight size={24} className="text-emerald-600" />
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="relative">
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm h-full">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">4</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">Compartilhamento</h3>
                <p className="text-gray-600">
                  Envie o plano para sua paciente em formato PDF ou DOCX, pronto para implementação.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para Começar?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se aos profissionais que já estão transformando o atendimento em saúde feminina.
          </p>
          <Link 
            href="/auth/register" 
            className="bg-white text-emerald-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition shadow-md inline-block font-medium"
          >
            Criar Conta Agora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">L</div>
                <span className="ml-2 text-2xl font-bold">Lyz</span>
              </div>
              <p className="text-gray-400">
                Planos personalizados baseados na ciclicidade feminina para profissionais de saúde.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Planos Personalizados</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Análise de Exames</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Matriz IFM</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Medicina Tradicional Chinesa</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Sobre Nós</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contato</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Carreiras</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Termos de Serviço</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Política de Privacidade</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Cookies</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">LGPD</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Lyz.ai. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
