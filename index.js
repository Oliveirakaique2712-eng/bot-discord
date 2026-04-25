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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env 'MEU_TOKEN';

// 🔧 CONFIGURAÇÃO
const CATEGORIA_ABERTOS = '1497679326383181955';
const CATEGORIA_FECHADOS = '1497679375540289596';
const CANAL_PAINEL = '1497716662214856734';
const CARGO_STAFF = '1497002956824907916'; // 👈 MUITO IMPORTANTE

client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);

  const canal = client.channels.cache.get(CANAL_PAINEL);

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_ticket')
    .setPlaceholder('Escolha o tipo de ticket')
    .addOptions([
      { label: '🐛 Bug', value: 'bug' },
      { label: '💰 Compra', value: 'compra' },
      { label: '❓ Ajuda', value: 'ajuda' },
      { label: '🎬 Audiovisual', value: 'audiovisual' },
      { label: '🎨 Design', value: 'design' }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  canal.send({
    content: '🎫 Selecione o tipo de atendimento:',
    components: [row]
  });
});

// FUNÇÃO: verificar se é staff
function isStaff(member) {
  return member.roles.cache.has(CARGO_STAFF);
}

client.on('interactionCreate', async (interaction) => {

  // MENU
  if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {

    const tipo = interaction.values[0];

    const canal = await interaction.guild.channels.create({
      name: `ticket-${tipo}-${interaction.user.username}-${Math.floor(Math.random() * 9999)}`,
      type: ChannelType.GuildText,
      parent: CATEGORIA_ABERTOS,
      topic: interaction.user.id,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: CARGO_STAFF,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    const botoes = new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId('fechar_ticket')
        .setLabel('🔒 Finalizar')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('chamar_usuario')
        .setLabel('📢 Chamar')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('renomear_ticket')
        .setLabel('✏️ Renomear')
        .setStyle(ButtonStyle.Secondary)
    );

    canal.send({
      content: `🎫 Ticket de <@${interaction.user.id}> | Tipo: **${tipo}**`,
      components: [botoes]
    });

    interaction.reply({ content: '✅ Ticket criado!', ephemeral: true });
  }

  // BOTÕES
  if (interaction.isButton()) {

    // 🔒 FECHAR (SÓ STAFF)
    if (interaction.customId === 'fechar_ticket') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: '❌ Apenas a equipe pode fazer isso.', ephemeral: true });

      await interaction.channel.setParent(CATEGORIA_FECHADOS);
      return interaction.reply('🔒 Ticket finalizado!');
    }

    // 📢 CHAMAR (SÓ STAFF)
    if (interaction.customId === 'chamar_usuario') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: '❌ Apenas a equipe pode fazer isso.', ephemeral: true });

      const donoId = interaction.channel.topic;

      try {
        const user = await client.users.fetch(donoId);
        await user.send('📢 Você foi chamado no seu ticket!');
        interaction.reply('Mensagem enviada!');
      } catch {
        interaction.reply('Não consegui enviar DM.');
      }
    }

    // ✏️ RENOMEAR (SÓ STAFF)
    if (interaction.customId === 'renomear_ticket') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: '❌ Apenas a equipe pode fazer isso.', ephemeral: true });

      return interaction.reply({
        content: 'Use: `!renomear novo-nome`',
        ephemeral: true
      });
    }
  }
});

// COMANDOS
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // ADD MEMBRO
  if (message.content.startsWith('!add')) {
    if (!isStaff(message.member)) return;

    const membro = message.mentions.members.first();
    if (!membro) return message.reply('Marca alguém.');

    await message.channel.permissionOverwrites.edit(membro.id, {
      ViewChannel: true
    });

    message.reply('Membro adicionado!');
  }

  // RENOMEAR
  if (message.content.startsWith('!renomear')) {
    if (!isStaff(message.member)) return;

    const novoNome = message.content.split(' ').slice(1).join('-');
    if (!novoNome) return message.reply('Coloque um nome.');

    await message.channel.setName(`ticket-${novoNome}`);
    message.reply('Nome alterado!');
  }
});

client.login(TOKEN);
