const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.MEU_TOKEN;

client.once('ready', () => {
  console.log(`Bot online como ${client.user.tag}`);
});

// Armazena dados temporários do embed
const embedData = {};

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!embed') {
    embedData[message.author.id] = { titulo: '', descricao: '', imagem: '', canalId: message.channel.id };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('set_titulo').setLabel('Definir título').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_descricao').setLabel('Definir descrição').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_imagem').setLabel('Definir imagem').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('set_canal').setLabel('Escolher canal').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('enviar_embed').setLabel('Enviar').setStyle(ButtonStyle.Success)
    );

    await message.reply({ content: '📋 Painel de criação de embed:', components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const data = embedData[interaction.user.id];
  if (!data) return interaction.reply({ content: '❌ Nenhum painel ativo.', ephemeral: true });

  if (interaction.customId === 'set_titulo') {
    const modal = new ModalBuilder()
      .setCustomId('modal_titulo')
      .setTitle('Definir título')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('titulo').setLabel('Título').setStyle(TextInputStyle.Short)
        )
      );
    return interaction.showModal(modal);
  }

  if (interaction.customId === 'set_descricao') {
    const modal = new ModalBuilder()
      .setCustomId('modal_descricao')
      .setTitle('Definir descrição')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('descricao').setLabel('Descrição').setStyle(TextInputStyle.Paragraph)
        )
      );
    return interaction.showModal(modal);
  }

  if (interaction.customId === 'set_imagem') {
    const modal = new ModalBuilder()
      .setCustomId('modal_imagem')
      .setTitle('Definir imagem')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('imagem').setLabel('URL da imagem').setStyle(TextInputStyle.Short).setRequired(false)
        )
      );
    return interaction.showModal(modal);
  }

  if (interaction.customId === 'set_canal') {
    const modal = new ModalBuilder()
      .setCustomId('modal_canal')
      .setTitle('Escolher canal')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('canal').setLabel('ID do canal destino').setStyle(TextInputStyle.Short)
        )
      );
    return interaction.showModal(modal);
  }

  if (interaction.customId === 'enviar_embed') {
    const canal = interaction.guild.channels.cache.get(data.canalId);
    if (!canal || canal.type !== ChannelType.GuildText) {
      return interaction.reply({ content: '❌ Canal inválido.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(data.titulo || 'Sem título')
      .setDescription(data.descricao || '')
      .setColor(0x00AE86);

    if (data.imagem) embed.setImage(data.imagem);

    await canal.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Embed enviado!', ephemeral: true });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const data = embedData[interaction.user.id];
  if (!data) return;

  if (interaction.customId === 'modal_titulo') {
    data.titulo = interaction.fields.getTextInputValue('titulo');
    await interaction.reply({ content: '✅ Título definido!', ephemeral: true });
  }

  if (interaction.customId === 'modal_descricao') {
    data.descricao = interaction.fields.getTextInputValue('descricao');
    await interaction.reply({ content: '✅ Descrição definida!', ephemeral: true });
  }

  if (interaction.customId === 'modal_imagem') {
    data.imagem = interaction.fields.getTextInputValue('imagem');
    await interaction.reply({ content: '✅ Imagem definida!', ephemeral: true });
  }

  if (interaction.customId === 'modal_canal') {
    data.canalId = interaction.fields.getTextInputValue('canal');
    await interaction.reply({ content: '✅ Canal definido!', ephemeral: true });
  }
});

client.login(TOKEN);

