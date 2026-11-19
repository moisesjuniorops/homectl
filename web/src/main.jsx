import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./app.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { DatesProvider } from "@mantine/dates";
import { Notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import App from "./App.jsx";

dayjs.locale("pt-br");

const theme = createTheme({
  primaryColor: "teal",
  primaryShade: { light: 6, dark: 5 },
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  headings: { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: "800" },
  defaultRadius: "lg",
  cursorType: "pointer",
  components: {
    Card: { defaultProps: { radius: "xl", withBorder: true, shadow: "xs" } },
    Button: { defaultProps: { radius: "xl" } },
    Modal: { defaultProps: { radius: "xl", centered: true, overlayProps: { blur: 4 } } },
    TextInput: { defaultProps: { radius: "md" } },
    NumberInput: { defaultProps: { radius: "md" } },
    Select: { defaultProps: { radius: "md" } },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <DatesProvider settings={{ locale: "pt-br", firstDayOfWeek: 0 }}>
      <ModalsProvider labels={{ confirm: "Confirmar", cancel: "Cancelar" }}>
        <Notifications position="top-center" />
        <App />
      </ModalsProvider>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);
