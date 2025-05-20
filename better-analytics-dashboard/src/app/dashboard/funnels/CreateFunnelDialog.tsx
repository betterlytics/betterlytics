'use client';

import { toast } from "sonner";
import { useQueryClient } from '@tanstack/react-query';
import { postFunnelAction } from "@/app/actions/funnels";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCallback, useState } from "react";
import { PlusIcon, Trash2 } from "lucide-react";

type Page = {
  value: string;
  key: string;
}

type Funnel = {
  name: string;
  pages: Page[];
};

function generateTmpId() {
  return Math.random().toString(36).substring(2);
}

export function CreateFunnelDialog() {

  const [ funnel, setFunnel ] = useState<Funnel>({
    name: 'My new funnel',
    pages: [
      { key: generateTmpId(), value: '' },
      { key: generateTmpId(), value: '' },
    ]
  });

  const [ open, setOpen ] = useState<boolean>(false);

  const queryClient = useQueryClient()

  const submit = useCallback(() => {
    postFunnelAction(
      'default-site',
      funnel.name,
      funnel.pages.map((f) => f.value)
    )
      .then(() => {
        toast.success('Funnel created!');
        queryClient.invalidateQueries({ queryKey: ['funnels', 'default-site'] });
        setOpen(false);
      })
      .catch(() => toast.error('Funnel creation failed!'));
  }, [funnel]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Create Funnel</Button>
      </DialogTrigger>
      <DialogContent className="min-w-[80dvw] min-h-[50dvh] bg-gray-50">
        <DialogHeader>
          <DialogTitle>Create funnel</DialogTitle>
          <DialogDescription>
            Create a new funnel for your website.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                className="col-span-3 bg-white"
                value={funnel.name}
                onChange={
                  (evt) => setFunnel((prev) => ({...prev, name: evt.target.value}))
                }
              />
            </div>
            <div className="bg-white rounded-lg p-4 shadow flex flex-col col-span-1">
              <div className="grid gap-4">
                {
                  funnel
                    .pages
                    .map((page, index) => (
                      <div key={page.key} className="flex gap-2">
                        <Label htmlFor="page" className="text-right">
                          Page
                        </Label>
                        <Input
                          id="page"
                          placeholder="/hello/world"
                          className="col-span-3"
                          value={page.value}
                          onChange={
                            (evt) => setFunnel((prev) => {
                              const newPages = [
                                ...prev.pages
                              ];
                              newPages[index] = {
                                ...newPages[index],
                                value: evt.target.value
                              };
                              return {
                                ...prev,
                                pages: newPages
                              }
                            })
                          }
                        />
                        <Button
                          className="size-9"
                          variant='outline'
                          onClick={() => setFunnel((prev) => ({ ...prev, pages: prev.pages.filter((_page) => _page.key !== page.key) }))}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))
                }
                <Button
                  className="size-8 rounded-full"
                  onClick={() => setFunnel((prev) => ({ ...prev, pages: [ ...prev.pages, { key: generateTmpId(), value: '' }] }))}
                >
                  <PlusIcon />
                </Button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow flex flex-col col-span-2 text-center">
            <p>Placeholder</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
