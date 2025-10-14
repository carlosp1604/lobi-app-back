module.exports = async () => {
  const container = globalThis.__PG_TESTCONTAINER__

  if (container) {
    try {
      await container.stop()
    } catch (e) {
      console.warn(e)
    }
  }
}
