// components/History.jsx
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
} from "react-native";
import * as registros from "@/registros";
import * as mensagens from "@/messages";

export default function History({ visible, onClose }) {
  const scrollRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef();

  // terminal
  const [lines, setLines] = useState([]);
  const [current, setCurrent] = useState(""); // linha sendo digitada
  const [cursorVisible, setCursorVisible] = useState(true);
  const [messagesMode, setMessagesMode] = useState(false);
  const [prompt, setPrompt] = useState("$ MK-IV>");

  // login
  const [logged, setLogged] = useState(false);
  const [step, setStep] = useState("user");

  // cursor piscando
  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(timer);
  }, []);

  // boot
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
        delay += 400;
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
      duration: 600,
      useNativeDriver: true,
    }).start();
  }

  // enviar comando
  function handleSubmit() {
    const cmd = current.trim();
    if (!cmd) return;

    setLines((p) => [...p, `${prompt} ${cmd}`]);

    processCommand(cmd);
    setCurrent("");
    if (messagesMode) {
      setPrompt("$ messages>");
    } else {
      setPrompt("$ MK-IV>");
    }

    setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      60
    );
  }

  // login + comandos
  function processCommand(cmd) {
    if (!logged) return handleLogin(cmd);

    // abrir registros
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
          `>>> ABRINDO REGISTRO ${num} — ${data.titulo}`,
          "----------------------------------------------",
          ...data.conteudo,
          "",
        ]);
      } catch {
        print([`> Registro ${num} não encontrado.`]);
      }
      return;
    }

    // Se estivermos no modo messages
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
          print(["> Saindo de messages()."]);
          break;
        default:
          print([`> Comando não reconhecido no modo messages(): ${cmd}`]);
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
          "Comandos disponíveis:",
          "  mission()    → Detalhes da missão",
          "  records()    → Arquivos recuperados",
          "  echo()       → Transmissão fragmentada",
          "  messages()   → Seção de mensagens internas",
          "      group()  → Chat do grupo",
          "      system() → Logs do núcleo",
          "      order()  → Comunicados da Ordem",
          "  clear()      → Limpar terminal",
          "",
        ]);
        break;
      case "clear()":
        setLines([]);
        break;
      case "exit()":
        print(["> Nenhum modo especial ativo."]);
        break;
      default:
        print([`Comando não reconhecido: ${cmd}`]);
    }
  }

  // login flow
  function handleLogin(cmd) {
    if (step === "user") {
      if (cmd === "RS-07") {
        print([
          "> Código de piloto reconhecido.",
          "> Estabelecendo handshake criptografado...",
          ">>> Validação bem-sucedida.",
          "",
          "Insira a senha de acesso para continuar:",
          "",
        ]);
        setStep("pass");
      } else {
        print([
          "> [ERRO 41-A] Código de piloto não reconhecido.",
          "> Dica: utilize o identificador oficial designado pela Ordem.",
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
          "> Senha aceita.",
          ">>> Validando criptografia da credencial...",
          ">>> Handshake com o núcleo MK-IV estabelecido.",
          ">>> Autorização nível TÁLAMO concedida.",
          ">>> Permissões para o piloto RS-07 liberadas.",
          "",
          "==============================================",
          "   ACESSO CONCEDIDO // PILOTO RS-07",
          "   Setor de Operações: HAVOC — Ameaça Ativa",
          "   Status do Terminal: ONLINE",
          "==============================================",
          "",
          "Bem-vindo de volta, Piloto RS-07.",
          "Último login registrado: 2237.03.17 – Setor Sigma.",
          "Status do terminal: MK-IV operacional",
          "O sistema está operacional e aguardando comandos.",
          "",
          "Digite help() para visualizar protocolos disponíveis.",
          "",
        ]);

      } else {
        print([
          "> Falha de autenticação.",
          ">>> Código incorreto. Tentativa arquivada nos registros da Ordem.",
          ">>> Tente inserir o código de piloto novamente:",
          "",
        ]);
      }
    }
  }

  function print(block) {
    setLines((prev) => [...prev, ...block]);
  }

  // BOOT SEQUENCE
  const bootHeader = [
    ">>> Iniciando Terminal da Ordem MK-IV...",
    ">>> Carregando módulos do sistema...",
    ">>> Módulos carregados!",
    ">>> Sessão iniciada.",
    "============ Bem Vindo ao Sistema MK-IV ============",
    "Últimas atualizações instaladas: 12.03.2237",
    ">>> Verificando credenciais de usuário...",
    ">>> Nenhum usuário encontrado.",
    ">>> Autenticação de usuário requerida.",
    "",
    "Digite seu código de piloto:",
    "",
  ];

  // MISSION
  const missionBlock = [
    "",
    "================ MISSÃO ================",
    "ORDEM: EXPEDIÇÃO SETOR HAVOC",
    "PRIORIDADE: ÔMEGA",
    "",
    "OBJETIVO:",
    "  Localizar e extrair o Módulo Núcleo de Dobra.",
    "",
    "DURAÇÃO:",
    "  7–14 dias (estimado)",
    "",
    "RISCO:",
    "  Crítico — Zona Fora do Mapa",
    "",
    "REMUNERAÇÃO:",
    "  120.000 créditos Z",
    "",
    "PREPARATIVOS:",
    "  - Calibração matriz de dobra",
    "  - Isolamento de pulso",
    "  - Contenção magnética",
    "  - Protocolo offline",
    "",
    "AUTORIZAÇÃO:",
    "  Ordem Estelar de Reconhecimento",
    "========================================",
    "",
  ];

  // RECORDS
  function getRecordsList() {
    const keys = Object.keys(registros);
    if (keys.length === 0) return ["Nenhum registro encontrado."];

    const list = [
      "",
      "============== REGISTROS MK-IV ==============",
      "Arquivos recuperados da Rota Estelar:",
      "",
    ];

    keys.forEach((key, index) => {
      const reg = registros[key];
      const num = String(index + 1).padStart(2, "0");
      list.push(` [${num}] ${reg.titulo}`);
    });

    list.push(
      "",
      "Para abrir um registro, use:",
      "  abrirRegistro-00",
      ""
    );

    return list;
  }

  // MESSAGES ROOT
  const messagesBlock = [
    "",
    "=========== MENSAGENS MK-IV ===========",
    "Subcomandos disponíveis:",
    "  group()   → Mensagens do grupo: Amizades do Barulho",
    "  system()  → Logs da Nave Sirius Marrow",
    "  order()   → Comunicados oficiais da Ordem",
    "  exit()    → Sair do modo mensagens",
    "",
    "Digite um subcomando.",
    "",
  ];

  // GROUP
  function getMessageBlock(key) {
    const data = mensagens[key];
    if (!data) return ["> Nenhum arquivo de mensagem encontrado."];
    return data;
  }

  // ECO
  const echoBlock = [
    "",
    ">>> Recebendo transmissão fragmentada:",
    "",
    "...qui é ... pitão Rho ...",
    "...não Confi... naaaa ... rot ...",
    "...Ecli..er ... vai acord...",
    "",
    ">>> Fim do eco.",
    "",
  ];

  // UI
  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim },
        !visible && { display: "none" },
      ]}
    >
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>TERMINAL da ORDEM // MK-IV</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      <Pressable
        style={styles.terminalBox}
        onPress={() => inputRef.current?.focus()}
      >
        <ScrollView ref={scrollRef}>
          {lines.map((line, i) => (
            <Text key={i} style={styles.terminalText}>
              {line}
            </Text>
          ))}

          {/* Linha atual com cursor */}
          <Text style={styles.terminalText}>
            {prompt} {current}
            {cursorVisible ? "|" : " "}
          </Text>
        </ScrollView>

        {/* Input invisível */}
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

// ----------------------------------------------------------
// STYLES
// ----------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    backgroundColor: "rgba(0,0,0,0.92)",
    paddingTop: 30,
    paddingHorizontal: 15,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#0ff4",
    paddingBottom: 6,
    marginBottom: 15,
  },

  topTitle: {
    color: "#0ff",
    fontSize: 20,
    letterSpacing: 1,
  },

  closeBtn: {
    fontSize: 26,
    color: "#0ff",
  },

  terminalBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#0ff4",
    backgroundColor: "rgba(0,12,20,0.75)",
    borderRadius: 6,
    padding: 10,
  },

  terminalText: {
    color: "#8ff",
    fontSize: 16,
    fontFamily: "monospace",
    marginBottom: 4,
  },

  hiddenInput: {
    height: 0,
    width: 0,
    opacity: 0,
  },
});
