import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, Github, Linkedin, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Sateesh Kumar Singh | Agentic AI Leader" },
    { name: "description", content: "Portfolio of Sateesh Kumar Singh, Principal Consultant and Agentic AI leader with 20+ years in AI, data and cloud architecture." },
    { property: "og:title", content: "Sateesh Kumar Singh | Agentic AI Leader" },
    { property: "og:description", content: "Principal Consultant delivering enterprise Agentic AI, GenAI, data and cloud platforms." },
    { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

function Home() {
  return <>
    <section className="section-container grid min-h-[calc(100vh-4rem)] items-center gap-12 py-16 lg:grid-cols-[1fr_360px]">
      <div>
        <p className="mb-5 text-sm font-bold uppercase text-primary">Principal Consultant · Agentic AI Leader</p>
        <h1 className="max-w-4xl text-5xl font-bold leading-tight sm:text-7xl">Sateesh Kumar Singh</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">AI, GenAI, Data Science and Enterprise Architecture — 20+ years shipping production-grade intelligent systems for banking, automotive and healthcare.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Button asChild><Link to="/projects">View projects <ArrowRight /></Link></Button><Button asChild variant="outline"><Link to="/contact"><Mail /> Contact me</Link></Button><Button asChild variant="secondary"><a href="/Sateesh_Singh.pdf" download><Download /> Download CV</a></Button></div>
        <ul className="mt-10 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <li className="flex items-center gap-2"><Phone className="size-4 text-primary" /> +91 99200 74439</li><li className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> Mumbai, India</li><li><a className="flex items-center gap-2 hover:text-primary" href="mailto:sateesh.singh76@gmail.com"><Mail className="size-4 text-primary" /> sateesh.singh76@gmail.com</a></li><li><a className="flex items-center gap-2 hover:text-primary" href="https://wa.me/919920074439"><MessageCircle className="size-4 text-primary" /> WhatsApp</a></li>
        </ul>
      </div>
      <div className="mx-auto w-full max-w-sm">
        <img src="/images/sateesh-profile.jpg" alt="Sateesh Kumar Singh" width="704" height="704" className="aspect-square w-full rounded-md border border-border object-cover object-top shadow-2xl" />
        <div className="mt-4 flex items-center justify-between"><p className="text-sm font-semibold">20+ years of experience</p><div className="flex gap-2"><Button asChild variant="outline" size="icon"><a href="https://www.linkedin.com/in/sateesh-singh-2224b666/" aria-label="LinkedIn"><Linkedin /></a></Button><Button asChild variant="outline" size="icon"><a href="https://github.com/sateesh1976/" aria-label="GitHub"><Github /></a></Button></div></div>
      </div>
    </section>
    <section className="border-y border-border bg-secondary/40 py-16"><div className="section-container grid gap-8 sm:grid-cols-3">{[["20+", "Years experience"], ["6", "Global industries"], ["3", "Major cloud platforms"]].map(([value, label]) => <div key={label}><p className="text-4xl font-bold text-primary">{value}</p><p className="mt-2 text-muted-foreground">{label}</p></div>)}</div></section>
    <section className="section-container py-20"><p className="text-sm font-bold uppercase text-primary">Executive profile</p><h2 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">Turning ambitious AI strategies into durable enterprise systems.</h2><p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">I lead architecture and delivery across agentic AI, machine learning, data engineering and multi-cloud platforms—with a focus on measurable outcomes, governance and production reliability.</p></section>
  </>;
}