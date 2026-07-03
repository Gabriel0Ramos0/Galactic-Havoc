import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Dimensions
} from "react-native";
import * as registros from "@/components/data/registros";
import * as mensagens from "@/components/data/messages";
import { playSfx } from "@/components/controllers/AudioController";

const { width, height } = Dimensions.get("window");
const baseGreen = "#00ffaa";
const cyanNeon = "#00eaff";
const redNeon = "#ff453a";

export default function History({ visible, onClose }) {
  const scrollRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanlineAnim = useRef(new Animated.Value(-20)).current;
  const inputRef = useRef();

  // Terminal
  const [lines, setLines] = useState([]);
  const [current, setCurrent] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [messagesMode, setMessagesMode] = useState(false);
  const [prompt, setPrompt] = useState("$ MK-IV>");

  // Login
  const [logged, setLogged] = useState(false);
  const [step, setStep] = useState("user");

  // Cursor piscando
  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 450);
    return () => clearInterval(timer);
  }, []);

  // Linha de varredura CRT animada em loop
  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(scanlineAnim, {
          toValue: height * 0.85,
          duration: 4000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible]);

  // Boot sequence
  useEffect(() => {
    if (visible) {
      setLines([]);
      setCurrent("");
      setLogged(false);
      setStep("user");
      setMessagesMode(false);
      setPrompt("$ MK-IV>");
      startFade();

      let delay = 0;
      bootHeader.forEach((line) => {
        delay += 250; // Um pouco mais rápido para não entediar o jogador
        setTimeout(() => {
          setLines((prev) => [...prev, line]);
          scrollRef.current?.scrollToEnd({ animated: true });
        }, delay);
      });
    }
  }, [visible]);

  function startFade() {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }

  function handleSubmit() {
    const cmd = current.trim();
    if (!cmd) return;

    playSfx("textDigital");
    setLines((p) => [...p, `${prompt} ${cmd}`]);
    processCommand(cmd);
    setCurrent("");

    setTimeout(() => {
      if (messagesMode) {
        setPrompt("$ messages>");
      } else {
        setPrompt("$ MK-IV>");
      }
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
  }

  const handleClose = () => {
    playSfx("textDigital");
    onClose();
  };

  function processCommand(cmd) {
    if (!logged) return handleLogin(cmd);

    if (cmd.startsWith("abrirRegistro-")) {
      const num = cmd.replace("abrirRegistro-", "");
      const index = parseInt(num, 10) - 1;
      const keys = Object.keys(registros);
      const fileKey = keys[index];
      setLines([]);

      try {
        const data = registros[fileKey];
        if (!data) throw new Error();

        print([
          "",
          `=== ABRINDO REGISTRO ${num} — ${data.titulo} ===`,
          "--------------------------------------------------",
          ...data.conteudo,
          "",
        ]);
      } catch {
        print([`[ERRO] Registro ${num} não mapeado ou corrompido.`]);
      }
      return;
    }

    if (messagesMode) {
      switch (cmd.toLowerCase()) {
        case "group()":
          print(getMessageBlock("group"));
          break;
        case "system()":
          print(getMessageBlock("system"));
          break;
        case "order()":
          print(getMessageBlock("order"));
          break;
        case "exit()":
          setMessagesMode(false);
          print([">>> Retornando à raiz do sistema terminal MK-IV."]);
          break;
        default:
          print([`[ERRO] Comando inválido no canal de comunicações: ${cmd}`]);
      }
      return;
    }

    switch (cmd.toLowerCase()) {
      case "mission()":
        print(missionBlock);
        break;
      case "records()":
        print(getRecordsList());
        break;
      case "echo()":
        print(echoBlock);
        break;
      case "messages()":
        setMessagesMode(true);
        print(messagesBlock);
        break;
      case "help()":
        print([
          "",
          "=== DIRETÓRIO DE PROTOCOLOS MK-IV ===",
          "  mission()    -> Diretrizes e contratos da missão ativa.",
          "  records()    -> Banco de dados de arquivos criptografados.",
          "  echo()       -> Escuta de sinais de rádio residuais.",
          "  messages()   -> Acesso aos subcanais de mensagens integradas.",
          "     group()   -> Canal seguro: Amizades do Barulho.",
          "     system()  -> Diagnóstico da nave Sirius Marrow.",
          "     order()   -> Despachos imperiais da Ordem.",
          "  clear()      -> Expurgar buffer do terminal.",
          "",
        ]);
        break;
      case "clear()":
        setLines([]);
        break;
      case "exit()":
        print([">>> Nenhum subsetor de comando ativo no momento."]);
        break;
      default:
        print([`[ERRO] Comando desconhecido: "${cmd}". Digite help() para assistência.`]);
    }
  }

  function handleLogin(cmd) {
    if (step === "user") {
      if (cmd === "RS-07") {
        print([
          ">>> Identificador reconhecido pela Ordem Estelar.",
          ">>> Iniciando handshake de segurança quântica...",
          "=== AUTENTICAÇÃO INICIAL CONFIRMADA ===",
          "",
          "INSIRA A CHAVE DE ACESSO CRIPTOGRAFADA:",
          "",
        ]);
        setStep("pass");
      } else {
        print([
          "[ERRO] CÓDIGO DE PILOTO REJEITADO.",
          "> Verifique sua ID na documentação do Terminal MK-IV.",
          "",
        ]);
      }
      return;
    }

    if (step === "pass") {
      if (cmd === "Bruxo") {
        setLogged(true);
        setStep("logged");

        print([
          ">>> Assinatura digital verificada.",
          "=== PERMISSÃO CONCEDIDA // AUTORIZAÇÃO NÍVEL TÁLAMO ===",
          "",
          "====================================================",
          " PILOTO RS-07 CONECTADO AO SISTEMA",
          " STATUS DA MATRIZ: TOTALMENTE OPERACIONAL",
          "====================================================",
          "",
          "Bem-vindo de volta à rede, Operador.",
          "Último salto registrado: Estação Espacial Sigma, 2237.03.17.",
          "Pronto para receber novos parâmetros de dados.",
          "",
          "Digite help() para descriptografar os comandos da missão.",
          "",
        ]);
      } else {
        print([
          "[ERRO] CHAVE ACESSO INCORRETA.",
          "> Tentativa de força bruta registrada. Alerta de segurança enviado.",
          "> Insira o código novamente:",
          "",
        ]);
      }
    }
  }

  function print(block) {
    setLines((prev) => [...prev, ...block]);
  }

  // Função mágica que intercepta e colore cada linha baseado no contexto
  function getLineStyle(line) {
    if (line.startsWith("[ERRO]")) return styles.textError;
    if (line.startsWith(">>>")) return styles.textSystem;
    if (line.startsWith("===") || line.startsWith("  ")) return styles.textAccent;
    if (line.includes("->") || line.includes("→")) return styles.textSubtleHelp;
    return styles.textDefault;
  }

  const bootHeader = [
    ">>> Inicializando Terminal de Operações Estelares MK-IV...",
    ">>> Montando partições de arquivos locais...",
    ">>> Conexões estáveis estabelecidas.",
    "=== PROTOCOLO COMPILADO COM SUCESSO ===",
    "Última telemetria síncrona: 12.03.2237",
    ">>> Alerta: Nenhuma credencial ativa no cockpit.",
    "",
    "POR FAVOR, INFORME SEU CÓDIGO DE IDENTIFICAÇÃO DE PILOTO:",
    "",
  ];

  const missionBlock = [
    "",
    "==================== FILTRO DE MISSÃO ====================",
    "CONTRATO: EXTRAÇÃO NO SETOR HAVOC",
    "NÍVEL DE PERIGO: CATASTRÓFICO (ÔMEGA)",
    "",
    "OBJETIVO CENTRAL:",
    "  Localizar e resgatar o Módulo de Núcleo de Dobra Independente.",
    "",
    "PREVISÃO DE OPERAÇÃO:",
    "  07 a 14 ciclos planetários padrão.",
    "",
    "RECOMPENSA DE EXTRAÇÃO:",
    "  120.000 Créditos Líquidos da Federação Z",
    "",
    "LOGÍSTICA EXIGIDA:",
    "  - Calibração fina da matriz de dobra quântica",
    "  - Isolamento de pulsos magnéticos térmicos",
    "  - Ativação do protocolo de rádio fantasma (Offline Mode)",
    "",
    "EMISSOR DA DIRETRIZ: Alto Conselho de Reconhecimento Estelar",
    "==========================================================",
    "",
  ];

  function getRecordsList() {
    const keys = Object.keys(registros);
    if (keys.length === 0) return ["[ERRO] Banco de dados de registros vazio."];

    const list = [
      "",
      "=== ARQUIVOS RECUPERADOS DA ROTA ESTELAR ===",
      "",
    ];

    keys.forEach((key, index) => {
      const reg = registros[key];
      const num = String(index + 1).padStart(2, "0");
      list.push(`  [FILE_${num}] -> ${reg.titulo.toUpperCase()}`);
    });

    list.push(
      "",
      "Para descriptografar e ler, execute o comando:",
      "  abrirRegistro-X (Ex: abrirRegistro-1)",
      ""
    );

    return list;
  }

  const messagesBlock = [
    "",
    "=== CENTRAL DE COMUNICAÇÃO DE BORDO ===",
    "Canais disponíveis para escuta:",
    "  group()   -> Mensagens da tripulação local.",
    "  system()  -> Logs de telemetria da Sirius Marrow.",
    "  order()   -> Despachos criptografados de comando superior.",
    "  exit()    -> Fechar módulo de mensagens.",
    "",
    "Aguardando a seleção do canal...",
    "",
  ];

  function getMessageBlock(key) {
    const data = mensagens[key];
    if (!data) return ["[ERRO] Dados indisponíveis neste setor de rádio."];
    return data;
  }

  const echoBlock = [
    "",
    ">>> Interceptando ondas de rádio residuais na área:",
    "",
    "   \"...aqui é o Ca...pitão Rho ... não...\"",
    "   \"...NÃO CONFIE ... naaa ... rot... de sa...\"",
    "   \"...A Ecli...er está acord... fuj...\"",
    "",
    ">>> Sinal perdido. Varredura finalizada.",
    "",
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim },
        !visible && { display: "none" },
      ]}
    >
      {/* Barra de título estilo HUD militar */}
      <View style={styles.topBar}>
        <View style={styles.statusGroup}>
          <View style={styles.pulseNode} />
          <Text style={styles.topTitle}>SECURE_LOG // TERMINAL MK-IV</Text>
        </View>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeBtn}>[X FECHAR]</Text>
        </TouchableOpacity>
      </View>

      {/* Caixa do Terminal */}
      <Pressable
        style={styles.terminalBox}
        onPress={() => inputRef.current?.focus()}
      >
        {/* Linha CRT Horizontal Animada */}
        <Animated.View style={[styles.scanline, { transform: [{ translateY: scanlineAnim }] }]} />

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {lines.map((line, i) => (
            <Text key={i} style={[styles.terminalText, getLineStyle(line)]}>
              {line}
            </Text>
          ))}

          {/* Prompt de comando atual */}
          <Text style={[styles.terminalText, styles.textPrompt]}>
            {prompt} <Text style={styles.inputText}>{current}</Text>
            {cursorVisible ? <Text style={styles.cursor}>█</Text> : <Text style={{ opacity: 0 }}>█</Text>}
          </Text>
        </ScrollView>

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={current}
          onChangeText={setCurrent}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSubmit}
          blurOnSubmit={false}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    backgroundColor: "#02070d", // Azul espacial ultra profundo
    paddingTop: 25,
    paddingHorizontal: 20,
    zIndex: 99,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(0, 255, 170, 0.25)",
    paddingBottom: 8,
    marginBottom: 12,
  },
  statusGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  pulseNode: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: baseGreen,
    marginRight: 8,
  },
  topTitle: {
    color: baseGreen,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  closeBtn: {
    fontSize: 11,
    color: redNeon,
    fontWeight: "bold",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  terminalBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0, 234, 255, 0.25)",
    backgroundColor: "rgba(1, 10, 18, 0.85)",
    borderRadius: 4,
    padding: 15,
    overflow: "hidden",
  },
  scanline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: "rgba(0, 234, 255, 0.12)",
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  terminalText: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    lineHeight: 20,
    marginBottom: 2,
  },
  /* ESTILOS DE CORES POR LINHA CONTEXTUAL */
  textDefault: {
    color: "rgba(160, 220, 255, 0.85)", // Texto padrão azul claro fosco
  },
  textSystem: {
    color: baseGreen, // Logs de boot / carregamento com verde militar
    fontWeight: "600",
  },
  textAccent: {
    color: cyanNeon, // Caixas divisórias de título e headers em Ciano brilhante
    fontWeight: "bold",
  },
  textError: {
    color: redNeon, // Mensagens de bloqueio ou chaves incorretas
    fontWeight: "bold",
  },
  textSubtleHelp: {
    color: "rgba(0, 234, 255, 0.6)", // Explicações do menu de ajuda
  },
  textPrompt: {
    color: cyanNeon,
    fontWeight: "bold",
    marginTop: 6,
  },
  inputText: {
    color: "#fff",
    fontWeight: "normal",
  },
  cursor: {
    color: cyanNeon,
    fontSize: 14,
  },
  hiddenInput: {
    height: 0,
    width: 0,
    opacity: 0,
    position: "absolute",
  },
});