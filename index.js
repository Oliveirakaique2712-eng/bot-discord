const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.MEU_TOKEN;

// 🔧 CONFIGURAÇÃO
const CATEGORIA_ABERTOS  = '1497679326383181955';
const CATEGORIA_FECHADOS = '1497679375540289596'; // 👈 troque pelo ID real
const CANAL_LOGS         = '1497679375540289596';
const CANAL_PAINEL       = '1498318862050001056';
const CARGO_STAFF        = '1497002956824907916';

// ── READY ──────────────────────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);

  const canal = client.channels.cache.get(CANAL_PAINEL);
  if (!canal) return console.error('Canal painel não encontrado!');

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_ticket')
    .setPlaceholder('Escolha o tipo de ticket')
    .addOptions([
      { label: '🐛 Bug',         value: 'bug'         },
      { label: '💰 Compra',      value: 'compra'      },
      { label: '❓ Ajuda',       value: 'ajuda'       },
      { label: '🎬 Audiovisual', value: 'audiovisual' },
      { label: '🎨 Design',      value: 'design'      }
    ]);

  await canal.send({
    content: '🎫 Selecione o tipo de atendimento:',
    components: [new ActionRowBuilder().addComponents(menu)]
  });
});

// ── HELPERS ────────────────────────────────────────────────────────────────
function isStaff(member) {
  return member.roles.cache.has(CARGO_STAFF);
}

// ── INTERAÇÕES ─────────────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {

  // MENU
  if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {
    const tipo     = interaction.values[0];
    const ticketID = Math.floor(1000 + Math.random() * 9000);

    const canal = await interaction.guild.channels.create({
      name: `ticket-${tipo}-${ticketID}`,
      type: ChannelType.GuildText,
      parent: CATEGORIA_ABERTOS,
      topic: interaction.user.id,
      permissionOverwrites: [
        { id: interaction.guild.id, deny:  [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id,  allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: CARGO_STAFF,          allow: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('fechar_ticket').setLabel('🔒 Finalizar').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('chamar_usuario').setLabel('📢 Chamar').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('renomear_ticket').setLabel('✏️ Renomear').setStyle(ButtonStyle.Secondary)
      
    // 📢 CHAMAR (SÓ STAFF)
    if (interaction.customId === 'chamar_usuario') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: '❌ Apenas a equipe pode fazer isso.', ephemeral: true });

      const donoId = interaction.channel.topic;
      try {
        const user = await client.users.fetch(donoId);
        await user.send('📢 Você foi chamado no seu ticket! Volte ao servidor.');
        await interaction.reply({ content: '✅ Usuário notificado por DM.', ephemeral: true });
      } catch {
        await interaction.reply({ content: '❌ Não consegui enviar DM para o usuário.', ephemeral: true });
      }
    }

    // ✏️ RENOMEAR (SÓ STAFF)
    if (interaction.customId === 'renomear_ticket') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: '❌ Apenas a equipe pode fazer isso.', ephemeral: true });

      await interaction.reply({ content: 'Use o comando: `!renomear novo-nome`', ephemeral: true });
    }
  }
});

// ── COMANDOS DE TEXTO ──────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // !add @membro
  if (message.content.startsWith('!add')) {
    if (!isStaff(message.member)) return;
    const membro = message.mentions.members.first();
    if (!membro) return message.reply('Marca alguém.');
    await message.channel.permissionOverwrites.edit(membro.id, { ViewChannel: true });
    await message.reply(`✅ ${membro.user.tag} adicionado ao ticket.`);
  }

  // !renomear novo-nome
  if (message.content.startsWith('!renomear')) {
    if (!isStaff(message.member)) return;
    const novoNome = message.content.split(' ').slice(1).join('-');
    if (!novoNome) return message.reply('Coloque um nome. Ex: `!renomear vip-compra`');
    await message.channel.setName(`ticket-${novoNome}`);
    await message.reply('✅ Nome alterado!');
  }
});

client.login(TOKEN);
