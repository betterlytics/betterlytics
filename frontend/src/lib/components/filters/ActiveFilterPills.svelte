<script lang="ts">
  export let filters: Array<{ id: string; text: string; onRemove: () => void }> = [];
</script>

<div class="active-filter-pills">
  {#each filters as filter (filter.id)}
    <div class="pill" title={filter.text}>
      <span class="pill-text">{filter.text}</span>
      <button class="remove-btn" on:click={filter.onRemove}>×</button>
    </div>
  {/each}
</div>

<style>
  .active-filter-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    background-color: #e2e8f0;
    border-radius: 9999px;
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
    max-width: calc(100% - 1rem);
  }
  .pill-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .remove-btn {
    margin-left: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    padding: 0;
  }
  @media (max-width: 768px) {
    .pill {
      max-width: calc(100% - 1rem);
    }
  }
</style>
