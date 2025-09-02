import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AuthButton from "@/components/auth/auth-button";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Upload, FileText, Zap, Shield, Search, Target } from "lucide-react";
import { SmartHomepage } from "@/components/smart-homepage";

export default function Home() {
  return <SmartHomepage />
}
